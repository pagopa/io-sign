import { PDFDocument, PDFForm } from "pdf-lib";

import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as t from "io-ts";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { pipe } from "fp-ts/function";
import { toError } from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { validate } from "../validation";
import { EntityNotFoundError } from "../error";

export const PdfMetadata = t.type({
  title: t.string,
  creationDate: IsoDateFromString,
  modificationDate: IsoDateFromString,
  pages: t.array(
    t.type({
      number: NonNegativeNumber,
      width: NonNegativeNumber,
      height: NonNegativeNumber,
    })
  ),
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
      pages: pdfDocument.getPages().map((page, number) => ({
        ...page.getSize(),
        number,
      })),
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

export const populatePdf = (pdfFields: Field[]) => (buffer: Buffer) =>
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
