import {
  DocumentMetadata,
  PdfDocumentMetadata,
} from "@io-sign/io-sign/document";

import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { validateSignatureFieldsWithMetadata } from "./validate-upload";

export const IsPdfDocumentCompatibleWithMetadata = (
  pdfDocumentMetadata: PdfDocumentMetadata,
  documentMetadata: DocumentMetadata
) =>
  pipe(
    validateSignatureFieldsWithMetadata(pdfDocumentMetadata)(
      documentMetadata.signatureFields
    ),
    E.isRight
  );
