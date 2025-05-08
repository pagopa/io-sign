import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";
import { validate } from "@io-sign/io-sign/validation";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  CreateFilledDocumentPayload,
  FillDocumentPayload,
  FilledDocumentUrl,
  NotifyDocumentToFillEvent
} from "../../filled-document";
import { GetFilledDocumentUrl } from "../../infra/azure/functions/create-filled-document";

/** Create and return the storage path (URL) for the ToS document.
 * The caller of this API is expected to poll on it since the endpoint will return 404 until the ToS document gets processed.
 */
export const makeCreateFilledDocumentUrl =
  (
    getFilledDocumentUrl: GetFilledDocumentUrl,
    notifyDocumentToFill: NotifyDocumentToFillEvent,
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId
  ) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name
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
            documentUrl
          },
          validate(
            FillDocumentPayload,
            "Invalid document to fill notification payload"
          ),
          TE.fromEither,
          TE.chain(notifyDocumentToFill)
        )
      ),
      TE.chainEitherKW((callbackDocumentUrl) =>
        pipe(
          callbackDocumentUrl,
          validate(FilledDocumentUrl, "Invalid filled document url"),
          E.map((url) => ({
            url
          }))
        )
      )
    );
  };
