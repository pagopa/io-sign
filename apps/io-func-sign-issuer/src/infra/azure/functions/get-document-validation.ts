import { validate } from "@io-sign/io-sign/validation";
import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import * as multipart from "parse-multipart";

import { getPdfMetadata } from "@io-sign/io-sign/infra/pdf";
import { sequenceS } from "fp-ts/lib/Apply";

import { success, error } from "@io-sign/io-sign/infra/http/response";
import { HttpBadRequestError } from "@io-sign/io-sign/infra/http/errors";
import { DocumentMetadata as DocumentMetadataApiModel } from "../../http/models/DocumentMetadata";
import { DocumentMetadataFromApiModel } from "../../http/decoders/document";

import { DocumentValidation } from "../../http/models/DocumentValidation";
import { IsPdfDocumentCompatibleWithMetadata } from "../../../app/use-cases/get-document-validation";

const makeGetDocumentValidationHandler = () => {
  const requireIsPdfDocumentCompatibleWithMetadataPayload = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chainIOK((req) => () => {
      const [, boundary] = req.headers["content-type"]
        ? req.headers["content-type"].split(/;\sboundary=/i)
        : [];
      const parts = boundary
        ? multipart.Parse(Buffer.from(req.body as string), boundary)
        : [];
      return parts.reduce(
        (obj, part) => {
          switch (part.type) {
            case "application/json":
              return {
                ...obj,
                document_metadata: JSON.parse(part.data.toString()),
              };
            case "application/pdf":
              return {
                ...obj,
                document: part.data,
              };
          }
          return obj;
        },
        {
          document_metadata: {},
          document: Buffer.from(""),
        }
      );
    }),
    TE.chainW(({ document, document_metadata }) =>
      sequenceS(TE.ApplyPar)({
        documentMetadata: pipe(
          document_metadata,
          validate(DocumentMetadataApiModel.pipe(DocumentMetadataFromApiModel)),
          TE.fromEither
        ),
        document: pipe(
          getPdfMetadata(document),
          TE.altW(() =>
            TE.left(
              new HttpBadRequestError("Invalid document supplied") as Error
            )
          )
        ),
      })
    )
  );
  return createHandler(
    requireIsPdfDocumentCompatibleWithMetadataPayload,
    ({ document, documentMetadata }) =>
      TE.right(IsPdfDocumentCompatibleWithMetadata(document, documentMetadata)),
    error,
    (isValid) =>
      success(DocumentValidation)({
        is_valid: isValid,
      })
  );
};

export const makeGetDocumentValidationFunction = flow(
  makeGetDocumentValidationHandler,
  azure.unsafeRun
);
