import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId } from "@internal/io-sign/signer";

import { EntityNotFoundError } from "@internal/io-sign/error";
import { Field, populatePdf } from "@internal/pdf-handler/pdf";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import { UploadBlob } from "../../infra/azure/storage/blob";

import { CreateFilledDocumentPayload } from "./create-filled-document";

export const FillDocumentPayload = t.intersection([
  CreateFilledDocumentPayload,
  t.type({
    filledDocumentFileName: NonEmptyString,
  }),
]);

export type FillDocumentPayload = t.TypeOf<typeof FillDocumentPayload>;

// these types define the fields inside the PDF file to be enhanced
// TODO: These are not yet the real parameters. Pending communication from the QTSP [SFEQS-1164]
type NameField = Field & { fieldName: "name" };
type FamilyNameField = Field & { fieldName: "surname" };
type EmailField = Field & { fieldName: "email" };
type FiscalCodeField = Field & { fieldName: "CF" };
type Fields = [NameField, FamilyNameField, EmailField, FiscalCodeField];

// This function downloads the pdf form, compiles it and uploads it to blobStorage
export const makeFillDocument =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    uploadFilledDocument: UploadBlob,
    fetchWithTimeout: typeof fetch
  ) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name,
    filledDocumentFileName,
  }: FillDocumentPayload) =>
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
          TE.chain(uploadFilledDocument(filledDocumentFileName))
        );
      })
    );
