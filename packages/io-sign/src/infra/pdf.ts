import { PDFDocument } from "pdf-lib";

import * as TE from "fp-ts/TaskEither";
import * as t from "io-ts";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { pipe } from "fp-ts/function";
import { toError } from "fp-ts/lib/Either";
import { validate } from "../validation";

export const PdfMetadata = t.partial({
  title: t.string,
  creationDate: IsoDateFromString,
  modificationDate: IsoDateFromString,
});

export type PdfMetadata = t.TypeOf<typeof PdfMetadata>;

export const getPdfMetadata = (buffer: Buffer) =>
  pipe(
    TE.tryCatch(
      () =>
        PDFDocument.load(buffer, {
          updateMetadata: false,
        }),
      toError
    ),
    TE.map((pdfDocument) => ({
      title: pdfDocument.getTitle(),
      creationDate: pdfDocument.getCreationDate(),
      modificationDate: pdfDocument.getModificationDate(),
    })),
    TE.chainEitherKW(
      validate(PdfMetadata, "Failed to extract metadata from pdf file!")
    )
  );
