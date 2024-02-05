import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { Field, populatePdf } from "@io-sign/io-sign/infra/pdf";

import { UploadBlob } from "../../infra/azure/storage/blob";
import { FillDocumentPayload } from "../../filled-document";

// these types define the fields inside the PDF file to be enhanced
// TODO: These are not yet the real parameters. Pending communication from the QTSP [SFEQS-1164]
type NameFieldB = Field & { fieldName: "QUADROB_name" };
type FamilyNameFieldB = Field & { fieldName: "QUADROB_lastname" };
type EmailFieldB = Field & { fieldName: "QUADROB_email" };
type FiscalCodeFieldB = Field & { fieldName: "QUADROB_fiscalcode" };

type NameFieldE = Field & { fieldName: "QUADROE_name" };
type FamilyNameFieldE = Field & { fieldName: "QUADROE_lastname" };

type Fields = [
  NameFieldB,
  FamilyNameFieldB,
  EmailFieldB,
  FiscalCodeFieldB,
  NameFieldE,
  FamilyNameFieldE,
];

/** Downloads the ToS pdf form, compiles and stores the filled document. */
export const makeFillDocument =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    uploadFilledDocument: UploadBlob,
    fetchWithTimeout: typeof fetch,
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
            new EntityNotFoundError("Fiscal code not found for this signer!"),
        ),
      ),
      TE.chain((fiscalCode) => {
        const fields: Fields = [
          {
            fieldName: "QUADROB_name",
            fieldValue: name,
          },
          {
            fieldName: "QUADROB_lastname",
            fieldValue: familyName,
          },
          {
            fieldName: "QUADROB_email",
            fieldValue: email,
          },
          {
            fieldName: "QUADROB_fiscalcode",
            fieldValue: fiscalCode,
          },
          {
            fieldName: "QUADROE_name",
            fieldValue: name,
          },
          {
            fieldName: "QUADROE_lastname",
            fieldValue: familyName,
          },
        ];

        return pipe(
          TE.tryCatch(() => fetchWithTimeout(documentUrl), E.toError),
          TE.chain((response) => TE.tryCatch(() => response.blob(), E.toError)),
          TE.chain((blob) => TE.tryCatch(() => blob.arrayBuffer(), E.toError)),
          TE.map((arrayBuffer) => Buffer.from(arrayBuffer)),
          TE.chain(populatePdf(fields)),
          TE.chain(uploadFilledDocument(filledDocumentFileName)),
        );
      }),
    );
