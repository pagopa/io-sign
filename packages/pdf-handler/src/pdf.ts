import { PDFDocument, PDFForm } from "pdf-lib";

import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as t from "io-ts";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { pipe } from "fp-ts/function";
import { toError } from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import { validate } from "@internal/io-sign/validation";
import { EntityNotFoundError } from "@internal/io-sign/error";

export const PdfMetadata = t.partial({
  title: t.string,
  creationDate: IsoDateFromString,
  modificationDate: IsoDateFromString,
});

export type PdfMetadata = t.TypeOf<typeof PdfMetadata>;

const loadPdf = (buffer: Buffer) =>
  TE.tryCatch(
    () =>
      PDFDocument.load(buffer, {
        updateMetadata: false,
      }),
    toError
  );

export const getPdfMetadata = (buffer: Buffer) =>
  pipe(
    buffer,
    loadPdf,
    TE.map((pdfDocument) => ({
      title: pdfDocument.getTitle(),
      creationDate: pdfDocument.getCreationDate(),
      modificationDate: pdfDocument.getModificationDate(),
    })),
    TE.chainEitherKW(
      validate(PdfMetadata, "Failed to extract metadata from pdf file!")
    )
  );

export type Field = {
  fieldName: string;
  fieldValue: string;
};

const populate = (form: PDFForm) => (field: Field) =>
  pipe(
    E.tryCatch(
      () => form.getTextField(field.fieldName),
      (e) =>
        e instanceof Error
          ? new EntityNotFoundError(e.message)
          : new EntityNotFoundError(
              "An error occurred while attempting to access the pdf fields."
            )
    ),
    E.map((textField) => textField.setText(field.fieldValue))
  );

/* fill out the pdf form with the fields inside
 * pdfFields and return the filled pdf in base64 */
export const populatePdf = (buffer: Buffer) => (pdfFields: Field[]) =>
  pipe(
    buffer,
    loadPdf,
    TE.chainEitherK((pdfDocument) =>
      pipe(
        pdfFields,
        A.traverse(E.Applicative)(populate(pdfDocument.getForm())),
        E.map(() => pdfDocument)
      )
    ),
    TE.chain((pdfDocument) => TE.tryCatch(() => pdfDocument.save(), toError))
  );
