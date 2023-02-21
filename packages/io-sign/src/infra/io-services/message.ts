import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow, identity } from "fp-ts/lib/function";
import { FiscalCode } from "@pagopa/io-functions-services-sdk/FiscalCode";
import { FeatureLevelTypeEnum } from "@pagopa/io-functions-services-sdk/FeatureLevelType";
import {
  NotificationMessage,
  SubmitNotificationForUser,
} from "../../notification";
import { HttpBadRequestError, HttpError } from "../http/errors";

import { ActionNotAllowedError, TooManyRequestsError } from "../../error";

import { IOApiClient } from "./client";
import { makeRetriveUserProfileSenderAllowed } from "./profile";

export const makeSubmitMessageForUser =
  (ioApiClient: IOApiClient): SubmitNotificationForUser =>
  (fiscalCode: FiscalCode) =>
  (message: NotificationMessage) =>
    pipe(
      fiscalCode,
      makeRetriveUserProfileSenderAllowed(ioApiClient),
      TE.filterOrElse(
        identity,
        () =>
          new ActionNotAllowedError(
            "It is not allowed to send a message to this user."
          )
      ),
      TE.chain(() =>
        TE.tryCatch(
          () =>
            ioApiClient.client.submitMessageforUserWithFiscalCodeInBody({
              message: {
                content: {
                  subject: message.subject,
                  markdown: message.markdown,
                  third_party_data:
                    "signatureRequestId" in message
                      ? {
                          id: message.signatureRequestId,
                          has_attachments: true,
                        }
                      : undefined,
                },
                fiscal_code: fiscalCode,
                /* feature_level_type field is used to identify the institutions that have subscribed to premium messages.
                 * In our case we have not adhered to any agreement therefore the field remains STANDARD but
                 * in any case we are enabled to use the attachments feature.
                 * The user associated with the service has been added to a particular group on the APIM.
                 */
                feature_level_type: FeatureLevelTypeEnum.STANDARD,
              },
            }),
          E.toError
        )
      ),
      TE.chain(
        flow(
          E.mapLeft(() => new Error("Unable to send the message!")),
          E.chainW((response) => {
            switch (response.status) {
              case 201:
                return E.right(response.value);
              case 429:
                return E.left(new TooManyRequestsError(`Too many requests!`));
              case 500:
                return E.left(
                  new HttpError(`The message cannot be delivered.`)
                );
              default:
                return E.left(
                  new HttpBadRequestError(
                    `An error occurred while sending the message!`
                  )
                );
            }
          }),
          TE.fromEither
        )
      ),
      TE.map((createdMessage) => ({
        ioMessageId: createdMessage.id as NonEmptyString,
      }))
    );
