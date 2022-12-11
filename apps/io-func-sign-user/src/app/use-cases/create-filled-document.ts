import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId, Signer } from "@io-sign/io-sign/signer";

import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { validate } from "@io-sign/io-sign/validation";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { FilledDocumentUrl } from "../../filled-document";

import { EnqueueMessage } from "../../infra/azure/storage/queue";
import { GetFilledDocumentUrl } from "../../infra/azure/functions/create-filled-document";

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

/** Create and return the storage path (URL) for the ToS document.
 * The caller of this API is expected to poll on it since the endpoint will return 404 until the ToS document gets processed.
 */
export const makeCreateFilledDocumentUrl =
  (
    getFilledDocumentUrl: GetFilledDocumentUrl,
    enqueueDocumentToFill: EnqueueMessage,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId
  ) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name,
  }: CreateFilledDocumentPayload) => {
    const filledDocumentFileName = `${signer.id}.pdf`;

    return pipe(
      signer.id,
      getFiscalCodeBySignerId,
      TE.chain(
        TE.fromOption(
          () =>
            new EntityNotFoundError("Fiscal code not found for this signer!")
        )
      ),
      TE.chain(() => getFilledDocumentUrl(filledDocumentFileName)),
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
