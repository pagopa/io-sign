import { identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { sequenceS } from "fp-ts/lib/Apply";
import {
  DocumentMetadata,
  FormFieldTypeEnum,
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes,
  DocumentMetadataPage,
} from "@io-sign/io-sign/document";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import {
  DeleteUploadDocument,
  DownloadUploadDocument,
  IsUploaded,
  markUploadMetadataAsValid,
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

const getPage =
  (pageNumber: NonNegativeNumber) => (pages: DocumentMetadata["pages"]) =>
    pipe(
      pages,
      A.filter((p) => p.number === pageNumber),
      A.head
    );

const isFieldInsidePage =
  (fieldAttributes: SignatureFieldToBeCreatedAttributes) =>
  (page: DocumentMetadataPage) =>
    fieldAttributes.coordinates.x + fieldAttributes.size.w < page.width &&
    fieldAttributes.coordinates.y + fieldAttributes.size.h < page.height;

const validateSignatureField =
  (formFields: DocumentMetadata["formFields"]) =>
  (attributes: SignatureFieldAttributes) =>
    pipe(
      formFields,
      A.filter((field) => field.name === attributes.uniqueName),
      A.head,
      E.fromOption(() => [
        new Error(
          `The dossier signature field (${attributes.uniqueName}) was not found in the uploaded document.`
        ),
      ]),
      E.chain((field) =>
        field.type === FormFieldTypeEnum.SIGNATURE
          ? E.right(true)
          : E.left([
              new Error(
                `The dossier signature field (${attributes.uniqueName}) doesn't appear to be a signature field.`
              ),
            ])
      )
    );

const validateSignatureFieldToBeCreated =
  (pages: DocumentMetadata["pages"]) =>
  (attributes: SignatureFieldToBeCreatedAttributes) =>
    pipe(
      pages,
      getPage(attributes.page),
      E.fromOption(() => [
        new Error(
          `The page number in the dossier signature field (${attributes.page}) was not found in the uploaded document.`
        ),
      ]),
      E.map(isFieldInsidePage(attributes)),
      E.chain((isValid) =>
        isValid
          ? E.right(true)
          : E.left([
              new Error(
                `The coordinates in the dossier are incompatible with the page size of the uploaded file.`
              ),
            ])
      )
    );

const applicativeValidation = E.getApplicativeValidation(
  A.getSemigroup<Error>()
);

const validateSignatureFieldsWithMetadata =
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
          ? pipe(attributes, validateSignatureField(formFields))
          : pipe(attributes, validateSignatureFieldToBeCreated(pages))
      ),
      A.sequence(applicativeValidation)
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
                    "No document was found with the specified document id."
                  )
              ),
              E.chain((document) =>
                pipe(
                  document.metadata.signatureFields,
                  validateSignatureFieldsWithMetadata(pages, formFields),
                  E.fold(
                    (validationErrors) =>
                      pipe(
                        signatureRequest,
                        markDocumentAsRejected(
                          uploadMetadata.documentId,
                          validationErrors.join("\n\n")
                        )
                      ),
                    () =>
                      pipe(
                        signatureRequest,
                        markDocumentAsReady(
                          uploadMetadata.documentId,
                          url,
                          pages,
                          formFields
                        )
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
        pipe(
          signatureRequest.status === "READY"
            ? markUploadMetadataAsValid(uploadMetadata)
            : uploadMetadata,
          upsertUploadMetadata
        )
      ),
      TE.chain(upsertSignatureRequest),
      TE.chain(() => deleteDocumentUploadedFromBlobStorage(uploadMetadata.id))
    );
