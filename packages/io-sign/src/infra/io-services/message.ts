import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import * as Enc from "io-ts/lib/Encoder";

import { NonEmptyString, Ulid } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow, identity } from "fp-ts/lib/function";
import { FiscalCode } from "@pagopa/io-functions-services-sdk/FiscalCode";
import { FeatureLevelTypeEnum } from "@pagopa/io-functions-services-sdk/FeatureLevelType";
import { NewMessage } from "@pagopa/io-functions-services-sdk/NewMessage";

import {
  NotificationContent,
  NotificationContentWithAttachments,
  NotificationMessage,
  SubmitNotificationForUser,
  NotificationService,
} from "../../notification";
import { HttpBadRequestError, HttpError } from "../http/errors";

import { ActionNotAllowedError, TooManyRequestsError } from "../../error";

import { IOApiClient } from "./client";
import { makeRetriveUserProfileSenderAllowed } from "./profile";

export const NotificationContentToApiModel: Enc.Encoder<
  NewMessage,
  NotificationContent
> = {
  encode: (message) => ({
    content: {
      subject: message.subject,
      markdown: message.markdown,
    },
  }),
};

export const NotificationContentWithAttachmentsToApiModel: Enc.Encoder<
  NewMessage,
  { notification: NotificationContentWithAttachments; configurationId: Ulid }
> = {
  encode: ({ notification, configurationId }) => ({
    content: {
      ...NotificationContentToApiModel.encode(notification).content,
      third_party_data: {
        id: notification.signatureRequestId,
        has_attachments: true,
        configuration_id: configurationId,
      },
    },
  }),
};

/** @deprecated use "IONotificationService" */
export const makeSubmitMessageForUser =
  (
    ioApiClient: IOApiClient,
    configurationId: Ulid
  ): SubmitNotificationForUser =>
  (fiscalCode: FiscalCode) =>
  (notification: NotificationMessage) =>
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
                ...("signatureRequestId" in notification
                  ? NotificationContentWithAttachmentsToApiModel.encode({
                      notification,
                      configurationId,
                    })
                  : NotificationContentToApiModel.encode(notification)),
                fiscal_code: fiscalCode,
                /* feature_level_type field is used to identify the institutions that have subscribed to premium messages.
                 * In our case we have not adhered to any agreement therefore the field remains STANDARD but
                 * in any case we are enabled to use the attachments feature.
                 * The user associated with the service has been added to a particular group (ApiThirdPartyMessageWrite) on the APIM.
                 */
                feature_level_type: FeatureLevelTypeEnum.ADVANCED,
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

export class IONotificationService implements NotificationService {
  #ioApiClient: IOApiClient;
  #configurationId: Ulid;

  constructor(ioApiClient: IOApiClient, configurationId: Ulid) {
    this.#ioApiClient = ioApiClient;
    this.#configurationId = configurationId;
  }

  submit(fiscalCode: FiscalCode, notification: NotificationMessage) {
    return makeSubmitMessageForUser(
      this.#ioApiClient,
      this.#configurationId
    )(fiscalCode)(notification);
  }
}
