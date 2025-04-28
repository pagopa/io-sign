import { Document } from "@io-sign/io-sign/document";
import { ActionNotAllowedError } from "@io-sign/io-sign/error";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { SignatureRequest } from "../../signature-request";
import {
  GetUploadUrl,
  InsertUploadMetadata,
  newUploadMetadata
} from "../../upload";

export interface GetUploadUrlPayload {
  signatureRequest: SignatureRequest;
  documentId: Document["id"];
}

export const makeGetUploadUrl =
  (insertUploadMetadata: InsertUploadMetadata, getUploadUrl: GetUploadUrl) =>
  ({ signatureRequest, documentId }: GetUploadUrlPayload) =>
    pipe(
      signatureRequest,
      TE.fromPredicate(
        (req) => req.status === "DRAFT",
        () =>
          new ActionNotAllowedError(
            `Unable to get the Upload Url. The Signature Request is in ${signatureRequest.status} status`
          )
      ),
      TE.chainEitherK(newUploadMetadata(documentId)),
      TE.chain(insertUploadMetadata),
      TE.chain(getUploadUrl)
    );
