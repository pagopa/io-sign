import { PDFDocument } from "pdf-lib";

import * as TE from "fp-ts/TaskEither";

import { pipe } from "fp-ts/function";
import { toError } from "fp-ts/lib/Either";

export const getPdfMetadata = (buffer: Buffer) =>
  pipe(
    TE.tryCatch(
      () =>
        PDFDocument.load(buffer, {
          updateMetadata: false,
        }),
      toError
    )
  );
