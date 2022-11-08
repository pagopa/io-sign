import { identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import {
  DownloadUploadDocumentFromBlob,
  IsUploaded,
  MoveUploadedDocument,
  UploadMetadata,
} from "../../upload";
import {
  GetSignatureRequest,
  markDocumentAsReady,
  markDocumentAsRejected,
  signatureRequestNotFoundError,
  startValidationOnDocument,
  UpsertSignatureRequest,
} from "../../signature-request";
import { getPdfMetadata } from "./validate-pdf";

export const makeValidateUpload =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    isUploaded: IsUploaded,
    moveUploadedDocument: MoveUploadedDocument,
    downloadDocumentUploadedFromBlobStorage: DownloadUploadDocumentFromBlob
  ) =>
  (uploadMetadata: UploadMetadata) =>
    pipe(
      getSignatureRequest(uploadMetadata.signatureRequestId)(
        uploadMetadata.issuerId
      ),
      TE.chain(TE.fromOption(() => signatureRequestNotFoundError)),
      TE.chainEitherK(startValidationOnDocument(uploadMetadata.documentId)),
      TE.chain(upsertSignatureRequest),
      TE.chain((signatureRequest) =>
        pipe(
          uploadMetadata.url,
          TE.fromNullable(new Error("Not found: url in upload metadata")),
          TE.chainFirst(() =>
            pipe(
              isUploaded(uploadMetadata.id),
              TE.filterOrElse(
                identity,
                () => new Error("Unable to find the uploaded document")
              ),
              TE.chain(() =>
                pipe(
                  uploadMetadata.id,
                  downloadDocumentUploadedFromBlobStorage,
                  TE.chain(getPdfMetadata)
                )
              )
            )
          ),
          TE.chain(moveUploadedDocument(uploadMetadata.documentId)),
          TE.chainEitherK((url) =>
            pipe(
              signatureRequest,
              markDocumentAsReady(uploadMetadata.documentId, url)
            )
          ),
          TE.altW(() =>
            pipe(
              signatureRequest,
              markDocumentAsRejected(
                uploadMetadata.documentId,
                "There was an error on the upload"
              ),
              TE.fromEither
            )
          )
        )
      ),
      TE.chain(upsertSignatureRequest)
    );
