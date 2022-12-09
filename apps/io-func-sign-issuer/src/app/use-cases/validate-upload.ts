import { identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { getPdfMetadata } from "@io-sign/io-sign/infra/pdf";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { sequenceS } from "fp-ts/lib/Apply";
import {
  DeleteUploadDocument,
  DownloadUploadDocument,
  IsUploaded,
  MoveUploadedDocument,
  UploadMetadata,
  UpsertUploadMetadata,
} from "../../upload";
import {
  GetSignatureRequest,
  markDocumentAsReady,
  markDocumentAsRejected,
  startValidationOnDocument,
  UpsertSignatureRequest,
} from "../../signature-request";

// TODO: [SFEQS-1216] this function cannot be aware of an infra module (@io-sign/io-sign/infra/pdf)
export const makeValidateUpload =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    isUploaded: IsUploaded,
    moveUploadedDocument: MoveUploadedDocument,
    downloadDocumentUploadedFromBlobStorage: DownloadUploadDocument,
    deleteDocumentUploadedFromBlobStorage: DeleteUploadDocument,
    upsertUploadMetadata: UpsertUploadMetadata
  ) =>
  (uploadMetadata: UploadMetadata) =>
    pipe(
      getSignatureRequest(uploadMetadata.signatureRequestId)(
        uploadMetadata.issuerId
      ),
      TE.chain(
        TE.fromOption(
          () =>
            new EntityNotFoundError(
              "The specified Signature Request does not exists."
            )
        )
      ),
      TE.chainEitherK(startValidationOnDocument(uploadMetadata.documentId)),
      TE.chain(upsertSignatureRequest),
      TE.chain((signatureRequest) =>
        pipe(
          sequenceS(TE.ApplySeq)({
            metadata: pipe(
              uploadMetadata.url,
              TE.fromNullable(new Error("Not found: url in upload metadata")),
              TE.chain(() =>
                pipe(
                  isUploaded(uploadMetadata.id),
                  TE.filterOrElse(
                    identity,
                    () => new Error("Unable to find the uploaded document")
                  ),
                  TE.chain(() =>
                    pipe(
                      downloadDocumentUploadedFromBlobStorage(
                        uploadMetadata.id
                      ),
                      TE.chain(getPdfMetadata)
                    )
                  )
                )
              )
            ),
            url: pipe(
              uploadMetadata.url,
              TE.fromNullable(new Error("Not found: url in upload metadata")),
              TE.chain(moveUploadedDocument(uploadMetadata.documentId))
            ),
          }),
          TE.chainEitherK(({ metadata: { pages }, url }) =>
            pipe(
              signatureRequest,
              markDocumentAsReady(uploadMetadata.documentId, url, pages)
            )
          ),
          TE.chainFirst(() =>
            upsertUploadMetadata({
              ...uploadMetadata,
              validated: true,
              updatedAt: new Date(),
            })
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
      TE.chain(upsertSignatureRequest),
      TE.chain(() => deleteDocumentUploadedFromBlobStorage(uploadMetadata.id))
    );
