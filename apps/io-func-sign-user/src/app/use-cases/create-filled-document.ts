import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId, Signer } from "@internal/io-sign/signer";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { agent } from "@pagopa/ts-commons";
import { EntityNotFoundError } from "@internal/io-sign/error";
import { Field, populatePdf } from "@internal/io-sign/infra/pdf";
import { validate } from "@internal/io-sign/validation";
import { retryingFetch } from "../../infra/http/retryable-fetch";
import { FilledDocumentUrl, UploadFilledDocument } from "../../filled-document";

export type CreateFilledDocumentPayload = {
  signer: Signer;
  documentUrl: string;
  email: EmailString;
  familyName: string;
  name: string;
};

export const makeCreateFilledDocument =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    uploadFilledDocument: UploadFilledDocument
  ) =>
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
          TE.chain((buffer) => {
            const fields: Field[] = [
              {
                fieldName: "name",
                fieldValue: name,
              },
              {
                fieldName: "surname",
                fieldValue: familyName,
              },
              {
                fieldName: "email",
                fieldValue: email,
              },
              {
                fieldName: "CF",
                fieldValue: fiscalCode,
              },
            ];
            return pipe(fields, populatePdf(buffer));
          }),
          TE.chain(uploadFilledDocument("filename.pdf")),
          TE.chainEitherKW((filledDocumentUrl) =>
            pipe(
              filledDocumentUrl,
              validate(FilledDocumentUrl, "Invalid filled document url"),
              E.map((url) => ({
                url,
              }))
            )
          )
        );
      })
    );
