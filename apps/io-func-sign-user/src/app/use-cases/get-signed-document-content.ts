import { Document, DocumentReady } from "@io-sign/io-sign/document";
import { GetDocumentContent } from "@io-sign/io-sign/document-content";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { getDocument } from "@io-sign/io-sign/signature-request";
import { validate } from "@io-sign/io-sign/validation";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  SignatureRequest,
  signedNoMoreThan90DaysAgo
} from "../../signature-request";

export const makeGetSignedDocumentContent =
  (getDocumentContent: GetDocumentContent) =>
  (signatureRequest: SignatureRequest, documentId: Document["id"]) =>
    pipe(
      signatureRequest,
      signedNoMoreThan90DaysAgo,
      TE.fromEither,
      TE.chain((signatureRequest) =>
        pipe(
          signatureRequest,
          getDocument(documentId),
          TE.fromOption(
            () =>
              new EntityNotFoundError(
                "The specified documentID does not exists."
              )
          ),
          TE.chainEitherKW(
            validate(DocumentReady, "The document must be in READY status.")
          ),
          TE.chain(getDocumentContent)
        )
      )
    );
