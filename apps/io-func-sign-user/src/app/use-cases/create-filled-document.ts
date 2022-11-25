import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId, Signer } from "@internal/io-sign/signer";

import { EntityNotFoundError } from "@internal/io-sign/error";
import { Field, populatePdf } from "@internal/pdf-handler/pdf";
import { validate } from "@internal/io-sign/validation";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { FilledDocumentUrl } from "../../filled-document";
import { GetBlobUrl, UploadBlob } from "../../infra/azure/storage/blob";
import { EnqueueMessage } from "../../infra/azure/storage/queue";

// these types define the fields inside the PDF file to be enhanced
// TODO: These are not yet the real parameters. Pending communication from the QTSP [SFEQS-1164]
type NameField = Field & { fieldName: "name" };
type FamilyNameField = Field & { fieldName: "surname" };
type EmailField = Field & { fieldName: "email" };
type FiscalCodeField = Field & { fieldName: "CF" };
type Fields = [NameField, FamilyNameField, EmailField, FiscalCodeField];

export type PrepareFilledDocumentPayload = {
  signer: Signer;
  documentUrl: NonEmptyString;
  email: EmailString;
  familyName: NonEmptyString;
  name: NonEmptyString;
};

export const makePrepareFilledDocument =
  (getBlobUrl: GetBlobUrl, enqueueMessage: EnqueueMessage) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name,
  }: PrepareFilledDocumentPayload) =>
    pipe(
      {
        signer,
        documentUrl,
        email,
        familyName,
        name,
      },
      JSON.stringify,
      enqueueMessage,
      TE.chain(() =>
        pipe(
          signer.id,
          getBlobUrl,
          TE.fromOption(
            () => new EntityNotFoundError("Unable to generate callback url!")
          )
        )
      ),
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

export const makeCreateFilledDocument =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    uploadBlob: UploadBlob,
    fetchWithTimeout: typeof fetch
  ) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name,
  }: PrepareFilledDocumentPayload) =>
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
          TE.chain(uploadBlob(`${signer.id}.pdf`))
        );
      })
    );
