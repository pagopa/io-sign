import { pipe, flow, constVoid } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as A from "fp-ts/lib/Array";

import { PdfDocumentMetadata } from "@io-sign/io-sign/document";

import {
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes,
  DocumentMetadata,
} from "@io-sign/io-sign/document";

import { getDocument } from "@io-sign/io-sign/signature-request";
import {
  getUploadMetadata,
  upsertUploadMetadata,
  getMetadataFromUploadedDocument,
  createDocumentFromUrl,
  markUploadMetadataAsValid,
  removeDocumentFromStorage,
} from "../../upload";

import {
  getSignatureRequest,
  upsertSignatureRequest,
  markDocumentAsReady,
  markDocumentAsRejected,
} from "../../signature-request";

const validateExistingSignatureField = (
  documentMetadata: PdfDocumentMetadata,
  { uniqueName }: SignatureFieldAttributes
): E.Either<string[], void> =>
  pipe(
    documentMetadata.formFields,
    A.findFirst((field) => field.name === uniqueName),
    E.fromOption(() => [
      `the field "${uniqueName}" was not found is the uploaded document`,
    ]),
    E.map(constVoid)
  );

const validateSignatureFieldToBeCreated = (
  documentMetadata: PdfDocumentMetadata,
  {
    page,
    coordinates: { x, y },
    size: { w, h },
  }: SignatureFieldToBeCreatedAttributes
) =>
  pipe(
    documentMetadata.pages,
    A.findFirst((p) => p.number === page),
    E.fromOption(() => [
      `the uploaded document has no ${page} as specified in its metadata`,
    ]),
    E.filterOrElse(
      (page) => x + w < page.width && y + h < page.height,
      () => [
        "the uploaded document is incompatible with the attributes of the signature field to be created",
      ]
    ),
    E.map(constVoid)
  );

const validateSignatureFields =
  (documentMetadata: PdfDocumentMetadata) =>
  (signatureFields: DocumentMetadata["signatureFields"]) =>
    pipe(
      signatureFields,
      A.map((field) => field.attributes),
      A.map((attr) =>
        SignatureFieldAttributes.is(attr)
          ? validateExistingSignatureField(documentMetadata, attr)
          : validateSignatureFieldToBeCreated(documentMetadata, attr)
      ),
      A.sequence(E.getApplicativeValidation(A.getSemigroup<string>())),
      E.mapLeft((problems) => new Error(problems.join("\n"))),
      E.map(constVoid)
    );

// from a blob uri get the "upload metadata" (entity that tracks the upload)
// does the signature request exists?
// is a PDF document? (download + open)
// the metadata declared in the dossier can be applied to this document?

// YES -------> mark the document as ready
// NO --------> mark the document as rejected
export const validateUpload = flow(
  getUploadMetadata,
  RTE.bindTo("meta"),

  RTE.bindW("signatureRequest", ({ meta }) =>
    getSignatureRequest(meta.signatureRequestId, meta.issuerId)
  ),

  RTE.chainW(({ signatureRequest, meta }) =>
    pipe(
      // Open the PDF document and check its metadata
      getMetadataFromUploadedDocument(meta.id),
      RTE.bindTo("documentMetadata"),

      // Check if signature fields are valid
      RTE.chainFirstEitherK(({ documentMetadata }) =>
        pipe(
          signatureRequest,
          getDocument(meta.documentId),
          E.fromOption(
            () =>
              new Error("no document was found with the specified document id")
          ),
          E.map((document) => document.metadata.signatureFields),
          E.chain(validateSignatureFields(documentMetadata))
        )
      ),

      // The uploaded PDF it's a valid Document for
      // the specified Signature Request. (mark as READY)
      RTE.chainW(({ documentMetadata }) =>
        pipe(
          meta.url,
          RTE.fromNullable(new Error("the upload has no file url")),
          RTE.chainW(createDocumentFromUrl(meta.documentId)),
          RTE.chainEitherKW((url) =>
            pipe(
              signatureRequest,
              markDocumentAsReady(meta.documentId, url, documentMetadata)
            )
          ),
          RTE.chainW(upsertSignatureRequest),
          // Update upload metadata and remove document
          // fromt temp storage
          RTE.chainW(() =>
            pipe(
              meta,
              markUploadMetadataAsValid,
              upsertUploadMetadata,
              RTE.map((meta) => meta.id),
              RTE.chainW(removeDocumentFromStorage)
            )
          )
        )
      ),
      // Mark the document as REJECTED on error
      RTE.orElseW((e) =>
        pipe(
          signatureRequest,
          markDocumentAsRejected(meta.documentId, e.message),
          RTE.fromEither,
          RTE.chain(upsertSignatureRequest),
          // Remove REJECTED file from temp storage
          RTE.chainW(() => removeDocumentFromStorage(meta.id))
        )
      )
    )
  )
);
