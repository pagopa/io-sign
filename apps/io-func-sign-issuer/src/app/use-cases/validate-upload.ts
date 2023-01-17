import { identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { sequenceS } from "fp-ts/lib/Apply";
import {
  DocumentMetadata,
  SignatureFieldAttributes,
} from "@io-sign/io-sign/document";

import {
  DeleteUploadDocument,
  DownloadUploadDocument,
  IsUploaded,
  MoveUploadedDocument,
  UploadMetadata,
  UpsertUploadMetadata,
} from "../../upload";
import {
  getDocument,
  GetSignatureRequest,
  markDocumentAsReady,
  markDocumentAsRejected,
  startValidationOnDocument,
  UpsertSignatureRequest,
} from "../../signature-request";

export type GetPdfMetadata = (buffer: Buffer) => TE.TaskEither<
  Error,
  {
    pages: DocumentMetadata["pages"];
    formFields: DocumentMetadata["formFields"];
  }
>;

const validateSignatureFieldsWithPdfMetadata =
  (
    pages: DocumentMetadata["pages"],
    formFields: DocumentMetadata["formFields"]
  ) =>
  (signatureFields: DocumentMetadata["signatureFields"]) =>
    pipe(
      signatureFields,
      A.map((signatureField) => signatureField.attributes),
      A.map((attributes) =>
        SignatureFieldAttributes.is(attributes)
          ? attributes.uniqueName in formFields.map((field) => field.name)
            ? E.right(true)
            : E.left(
                new Error(
                  `The dossier signature field (${attributes.uniqueName}) was not found in the uploaded document`
                )
              )
          : pipe(
              pages,
              A.filter((p) => p.number === attributes.page),
              A.head,
              E.fromOption(
                () =>
                  new Error(
                    `The page number in the dossier signature field (${attributes.page}) was not found in the uploaded document.`
                  )
              ),
              E.chain((page) =>
                attributes.coordinates.x + attributes.size.w < page.width &&
                attributes.coordinates.y + attributes.size.h < page.height
                  ? E.right(true)
                  : E.left(
                      new Error(
                        `The coordinates in the dossier are incompatible with the page size of the uploaded file.`
                      )
                    )
              )
            )
      )
    );

export const makeValidateUpload =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    isUploaded: IsUploaded,
    moveUploadedDocument: MoveUploadedDocument,
    downloadDocumentUploadedFromBlobStorage: DownloadUploadDocument,
    deleteDocumentUploadedFromBlobStorage: DeleteUploadDocument,
    upsertUploadMetadata: UpsertUploadMetadata,
    getPdfMetadata: GetPdfMetadata
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
              TE.fromNullable(new Error("Url not found in upload metadata")),
              TE.chain(moveUploadedDocument(uploadMetadata.documentId))
            ),
          }),
          TE.chainEitherK(({ metadata: { pages, formFields }, url }) =>
            pipe(
              signatureRequest,
              getDocument(uploadMetadata.documentId),
              E.fromOption(
                () =>
                  new EntityNotFoundError(
                    "The specified document does not exists."
                  )
              ),
              E.chain((document) =>
                pipe(
                  document.metadata.signatureFields,
                  validateSignatureFieldsWithPdfMetadata(pages, formFields),
                  A.separate,
                  (validationResults) =>
                    pipe(validationResults.left, A.isEmpty)
                      ? pipe(
                          signatureRequest,
                          markDocumentAsReady(
                            uploadMetadata.documentId,
                            url,
                            pages,
                            formFields
                          )
                        )
                      : pipe(
                          signatureRequest,
                          markDocumentAsRejected(
                            uploadMetadata.documentId,
                            validationResults.left.join("\n\n")
                          )
                        )
                )
              )
            )
          ),
          TE.altW(() =>
            pipe(
              signatureRequest,
              markDocumentAsRejected(
                uploadMetadata.documentId,
                "The uploaded file appears to be corrupted or does not appear to be a PDF file."
              ),
              TE.fromEither
            )
          )
        )
      ),
      TE.chainFirst((signatureRequest) =>
        upsertUploadMetadata({
          ...uploadMetadata,
          validated: signatureRequest.status === "READY",
          updatedAt: new Date(),
        })
      ),
      TE.chain(upsertSignatureRequest),
      TE.chain(() => deleteDocumentUploadedFromBlobStorage(uploadMetadata.id))
    );
