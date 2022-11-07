import { identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { sequenceS } from "fp-ts/lib/Apply";
import { IsUploaded, MoveUploadedDocument, UploadMetadata } from "../../upload";
import {
  GetSignatureRequest,
  markDocumentAsReady,
  markDocumentAsRejected,
  signatureRequestNotFoundError,
  startValidationOnDocument,
  UpsertSignatureRequest,
} from "../../signature-request";

export const makeValidateUpload =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    isUploaded: IsUploaded,
    moveUploadedDocument: MoveUploadedDocument
  ) =>
  (uploadMetadata: UploadMetadata) =>
    pipe(
      sequenceS(TE.ApplySeq)({
        signatureRequest: pipe(
          getSignatureRequest(uploadMetadata.signatureRequestId)(
            uploadMetadata.issuerId
          ),
          TE.chain(TE.fromOption(() => signatureRequestNotFoundError)),
          TE.chainEitherK(startValidationOnDocument(uploadMetadata.documentId)),
          TE.chain(upsertSignatureRequest)
        ),
        url: pipe(
          uploadMetadata.url,
          TE.fromNullable(new Error("Not found: url in upload metadata")),
          TE.chainFirst(() =>
            pipe(
              isUploaded(uploadMetadata.id),
              TE.filterOrElse(
                identity,
                () => new Error("Unable to find the uploaded document")
              )
            )
          ),
          TE.chain(moveUploadedDocument(uploadMetadata.documentId))
        ),
      }),
      TE.chainEitherK(({ signatureRequest, url }) =>
        pipe(
          pipe(
            signatureRequest,
            markDocumentAsReady(uploadMetadata.documentId, url)
          ),
          E.altW(() =>
            pipe(
              signatureRequest,
              markDocumentAsRejected(
                uploadMetadata.documentId,
                "There was an error on the upload"
              )
            )
          )
        )
      ),
      TE.chain(upsertSignatureRequest)
    );
