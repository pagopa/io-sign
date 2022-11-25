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

export type CreateFilledDocumentPayload = PrepareFilledDocumentPayload & {
  filledDocumentFileName: NonEmptyString;
};

/* This function returns only the callback url of the filled document without creating it.
 * It also writes on a queue the information necessary to start the module creation function via the trigger queue
 */
export const makePrepareFilledDocument =
  (getBlobUrl: GetBlobUrl, enqueueMessage: EnqueueMessage) =>
  ({
    signer,
    documentUrl,
    email,
    familyName,
    name,
  }: PrepareFilledDocumentPayload) => {
    const filledDocumentFileName = `${signer.id}.pdf`;

    return pipe(
      filledDocumentFileName,
      getBlobUrl,
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
          enqueueMessage
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

// This function downloads the pdf form, compiles it and uploads it to blobStorage
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
    filledDocumentFileName,
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
          TE.chain(uploadBlob(filledDocumentFileName))
        );
      })
    );
