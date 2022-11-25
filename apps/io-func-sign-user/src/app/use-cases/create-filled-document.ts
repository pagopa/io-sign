import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId, Signer } from "@internal/io-sign/signer";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { EntityNotFoundError } from "@internal/io-sign/error";
import { Field, populatePdf } from "@internal/pdf-handler/pdf";
import { validate } from "@internal/io-sign/validation";

import { FilledDocumentUrl, UploadFilledDocument } from "../../filled-document";

export type CreateFilledDocumentPayload = {
  signer: Signer;
  documentUrl: NonEmptyString;
  email: EmailString;
  familyName: NonEmptyString;
  name: NonEmptyString;
};

// these types define the fields inside the PDF file to be enhanced
// TODO: These are not yet the real parameters. Pending communication from the QTSP
type NameField = Field & { fieldName: "name" };
type FamilyNameField = Field & { fieldName: "surname" };
type EmailField = Field & { fieldName: "email" };
type FiscalCodeField = Field & { fieldName: "CF" };
type Fields = [NameField, FamilyNameField, EmailField, FiscalCodeField];

export const makeCreateFilledDocument =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    uploadFilledDocument: UploadFilledDocument,
    fetchWithTimeout: typeof fetch
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
        const fields: Fields = [
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

        return pipe(
          TE.tryCatch(() => fetchWithTimeout(documentUrl), E.toError),
          TE.chain((response) => TE.tryCatch(() => response.blob(), E.toError)),
          TE.chain((blob) => TE.tryCatch(() => blob.arrayBuffer(), E.toError)),
          TE.map((arrayBuffer) => Buffer.from(arrayBuffer)),
          TE.chain((buffer) => pipe(fields, populatePdf(buffer))),
          TE.chain(uploadFilledDocument(`${signer.id}.pdf`)),
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
