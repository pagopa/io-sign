import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { Signer } from "@internal/io-sign/signer";

import { EntityNotFoundError } from "@internal/io-sign/error";

import { validate } from "@internal/io-sign/validation";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { FilledDocumentUrl } from "../../filled-document";
import { GetBlobUrl } from "../../infra/azure/storage/blob";
import { EnqueueMessage } from "../../infra/azure/storage/queue";

export const CreateFilledDocumentPayload = t.type({
  signer: Signer,
  documentUrl: NonEmptyString,
  email: EmailString,
  familyName: NonEmptyString,
  name: NonEmptyString,
});

export type CreateFilledDocumentPayload = t.TypeOf<
  typeof CreateFilledDocumentPayload
>;

/* This function returns only the callback url of the filled document without creating it.
 * It also writes on a queue the information necessary to start the module creation function via the trigger queue
 */
export const makeCreateFilledDocument =
  (getFilledDocumentUrl: GetBlobUrl, enqueueDocumentToFill: EnqueueMessage) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name,
  }: CreateFilledDocumentPayload) => {
    const filledDocumentFileName = `${signer.id}.pdf`;

    return pipe(
      filledDocumentFileName,
      getFilledDocumentUrl,
      TE.fromOption(
        () => new EntityNotFoundError("Unable to generate callback url!")
      ),
      TE.chainFirst(() =>
        pipe(
          {
            signer,
            email,
            familyName,
            name,
            filledDocumentFileName,
            documentUrl,
          },
          JSON.stringify,
          enqueueDocumentToFill
        )
      ),
      TE.chainEitherKW((callbackDocumentUrl) =>
        pipe(
          callbackDocumentUrl,
          validate(FilledDocumentUrl, "Invalid filled document url"),
          E.map((url) => ({
            url,
          }))
        )
      )
    );
  };
