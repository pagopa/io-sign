import { Document } from "@internal/io-sign/document";
import { pipe } from "fp-ts/lib/function";
import { SignatureRequest } from "../../signature-request";

import {
  GetUploadUrl,
  InsertUploadMetadata,
  newUploadMetadata,
} from "../../upload";

import * as TE from "fp-ts/lib/TaskEither";

export type GetUploadUrlPayload = {
  signatureRequest: SignatureRequest;
  documentId: Document["id"];
};

export const makeGetUploadUrl =
  (insertUploadMetadata: InsertUploadMetadata, getUploadUrl: GetUploadUrl) =>
  ({ signatureRequest, documentId }: GetUploadUrlPayload) =>
    pipe(
      signatureRequest,
      newUploadMetadata(documentId),
      TE.fromEither,
      TE.chain(insertUploadMetadata),
      TE.chain(getUploadUrl)
    );
