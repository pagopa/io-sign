import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { identity, pipe } from "fp-ts/function";
import { sequenceS } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array";
import { toError } from "fp-ts/lib/Either";
import { PDFDocument } from "pdf-lib";

import { PdfDocumentMetadata } from "../document";
import { EntityNotFoundError } from "../error";
import { validate } from "../validation";

const loadPdf = (buffer: Buffer) =>
  TE.tryCatch(
    () =>
      PDFDocument.load(buffer, {
        updateMetadata: false
      }),
    toError
  );

export const getPdfMetadata = (
  buffer: Buffer
): TE.TaskEither<Error, PdfDocumentMetadata> =>
  pipe(
    buffer,
    loadPdf,
    TE.chainEitherK((pdfDocument) =>
      sequenceS(E.Apply)({
        formFields: pipe(
          E.tryCatch(
            () =>
              pdfDocument
                .getForm()
                .getFields()
                .map((field) => ({
                  type: field.constructor.name,
                  name: field.getName()
                }))
                .filter((field) => field.type === "PDFSignature"),
            E.toError
          ),
          E.fold(() => [], identity),
          E.of
        ),
        pages: E.tryCatch(
          () =>
            pdfDocument.getPages().map((page, number) => ({
              ...page.getSize(),
              number
            })),
          E.toError
        )
      })
    ),
    TE.chainEitherKW(
      validate(PdfDocumentMetadata, "Failed to extract metadata from pdf file!")
    )
  );

export interface Field {
  fieldName: string;
  fieldValue: string;
}

const populate = (pdfDocument: PDFDocument) => (field: Field) =>
  pipe(
    E.tryCatch(
      () => pdfDocument.getForm().getTextField(field.fieldName),
      E.toError
    ),
    E.map((textField) => textField.setText(field.fieldValue))
  );

const getFieldValue =
  (pdfDocument: PDFDocument) =>
  (fieldName: string): E.Either<EntityNotFoundError, Field> =>
    pipe(
      E.tryCatch(
        () => pdfDocument.getForm().getTextField(fieldName),
        E.toError
      ),
      E.chain((textField) =>
        pipe(
          textField.getText(),
          E.fromNullable(
            new EntityNotFoundError(
              "An error occurred while attempting to access the pdf field content."
            )
          ),
          E.map((value) => ({
            fieldName,
            fieldValue: value
          }))
        )
      )
    );

export const populatePdf = (pdfFields: Array<Field>) => (buffer: Buffer) =>
  pipe(
    buffer,
    loadPdf,
    TE.chainEitherK((pdfDocument) =>
      pipe(
        pdfFields,
        A.traverse(E.Applicative)(populate(pdfDocument)),
        E.map(() => pdfDocument)
      )
    ),
    TE.chain((pdfDocument) => TE.tryCatch(() => pdfDocument.save(), toError))
  );

export const getPdfFieldsValue =
  (pdfFieldsName: Array<string>) => (buffer: Buffer) =>
    pipe(
      buffer,
      loadPdf,
      TE.chainEitherK((pdfDocument) =>
        pipe(
          pdfFieldsName,
          A.traverse(E.Applicative)(getFieldValue(pdfDocument))
        )
      )
    );
