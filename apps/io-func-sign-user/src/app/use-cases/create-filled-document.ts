import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId, Signer } from "@internal/io-sign/signer";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { agent } from "@pagopa/ts-commons";
import { EntityNotFoundError } from "@internal/io-sign/error";
import { getPdfMetadata } from "@internal/io-sign/infra/pdf";
import { retryingFetch } from "../../infra/http/downloader";
import { validate } from "@internal/io-sign/validation";
import { FilledDocumentUrl } from "../../filled-document";

export type CreateFilledDocumentPayload = {
  signer: Signer;
  documentUrl: string;
  email: EmailString;
  familyName: string;
  name: string;
};

export const makeCreateFilledDocument =
  (getFiscalCodeBySignerId: GetFiscalCodeBySignerId) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name,
  }: CreateFilledDocumentPayload) =>
    pipe(
      signer.id,
      getFiscalCodeBySignerId,
      TE.chain(
        TE.fromOption(
          () =>
            new EntityNotFoundError("Fiscal code not found for this signer!")
        )
      ),
      TE.chain((fiscalCode) => {
        const httpApiFetch = agent.getHttpFetch(process.env);
        const retriableFetch = retryingFetch(httpApiFetch);
        return pipe(
          TE.tryCatch(() => retriableFetch(documentUrl), E.toError),
          TE.chain((response) => TE.tryCatch(() => response.blob(), E.toError)),
          TE.chain((blob) => TE.tryCatch(() => blob.arrayBuffer(), E.toError)),
          TE.map((arrayBuffer) => Buffer.from(arrayBuffer)),
          TE.chain((buffer) => getPdfMetadata(buffer)),

          TE.chainEitherKW(() =>
            pipe(
              "http://placeholder.it/filled_document",
              validate(FilledDocumentUrl, "Invalid filled document url"),
              E.map((url) => ({
                url,
              }))
            )
          )
        );
      })
    );
