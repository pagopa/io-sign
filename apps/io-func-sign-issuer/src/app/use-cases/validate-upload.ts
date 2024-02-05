import { pipe, flow, constVoid } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import * as RE from "fp-ts/lib/ReaderEither";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as A from "fp-ts/lib/Array";

import * as L from "@pagopa/logger";

import { PdfDocumentMetadata } from "@io-sign/io-sign/document";
import { EventName, createAndSendAnalyticsEvent } from "@io-sign/io-sign/event";

import {
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes,
  DocumentMetadata,
} from "@io-sign/io-sign/document";

import { getDocument } from "@io-sign/io-sign/signature-request";

import { getPdfMetadata } from "@io-sign/io-sign/infra/pdf";
import {
  getUploadMetadata,
  upsertUploadMetadata,
  getUploadedDocument,
  createDocumentFromUrl,
  markUploadMetadataAsValid,
  removeDocumentFromStorage,
  getUploadedDocumentUrl,
  UploadMetadata,
} from "../../upload";

import {
  getSignatureRequest,
  markDocumentAsReady,
  markDocumentAsRejected,
  startValidationOnDocument,
  patchSignatureRequestDocument,
} from "../../signature-request";

export const validateExistingSignatureField =
  (clauseTitle: string, { uniqueName }: SignatureFieldAttributes) =>
  (documentMetadata: PdfDocumentMetadata): E.Either<string[], void> =>
    pipe(
      documentMetadata.formFields,
      A.findFirst((field) => field.name === uniqueName),
      E.fromOption(() => [
        `(${clauseTitle}) the field "${uniqueName}" was not found is the uploaded document`,
      ]),
      E.map(constVoid),
    );

export const validateSignatureFieldToBeCreated =
  (
    clauseTitle: string,
    {
      page,
      coordinates: { x, y },
      size: { w, h },
    }: SignatureFieldToBeCreatedAttributes,
  ) =>
  (documentMetadata: PdfDocumentMetadata): E.Either<string[], void> =>
    pipe(
      documentMetadata.pages,
      A.findFirst((p) => p.number === page),
      E.fromOption(() => [
        `(${clauseTitle}) incompatible coordinates: unable to find page ${page} in the uploaded document`,
      ]),
      E.filterOrElse(
        (page) => x + w < page.width && y + h < page.height,
        () => [
          `(${clauseTitle}) incompatible coordinates: they can't fit in the uploaded document`,
        ],
      ),
      E.map(constVoid),
    );

const isCompatibleWithSignatureFields = (
  signatureFields: DocumentMetadata["signatureFields"],
): RE.ReaderEither<PdfDocumentMetadata, Error, void> =>
  pipe(
    signatureFields,
    A.map(({ attributes, clause: { title } }) =>
      SignatureFieldAttributes.is(attributes)
        ? validateExistingSignatureField(title, attributes)
        : validateSignatureFieldToBeCreated(title, attributes),
    ),
    A.sequence(RE.getApplicativeReaderValidation(A.getSemigroup<string>())),
    RE.mapLeft((problems) => new Error(problems.join("\n"))),
    RE.map(constVoid),
  );

const loggingContext = (meta: UploadMetadata) => ({
  uploadId: meta.id,
  signatureRequestId: meta.signatureRequestId,
});

// Validate a PDF document
export const validateDocument = (
  documentContent: Buffer,
  documentMetadata: PdfDocumentMetadata,
  signatureFields: DocumentMetadata["signatureFields"],
  loggingContext?: Record<string, unknown>,
) =>
  RTE.sequenceSeqArray([
    // check the magic number
    // to be a valid PDF file, the uploaded document must start with "%PDF" file signature
    pipe(
      documentContent.toString("utf-8", 0, 4),
      RTE.fromPredicate(
        (bytes) => bytes === "%PDF",
        () =>
          new Error(
            "the uploaded document has an invalid file signature (not a valid PDF)",
          ),
      ),
      RTE.map(constVoid),
    ),
    // check if the uploaded document metadata (document size, pages, existing signature fields)
    // are compatible with the given "signature fields" (existing or to be created)
    pipe(
      documentMetadata,
      isCompatibleWithSignatureFields(signatureFields),
      RTE.fromEither,
      RTE.chainFirstW(() =>
        L.debugRTE("the signature fields are valid", loggingContext),
      ),
    ),
  ]);

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
    getSignatureRequest(meta.signatureRequestId, meta.issuerId),
  ),
  RTE.bindW("document", ({ signatureRequest, meta }) =>
    pipe(
      signatureRequest,
      getDocument(meta.documentId),
      E.fromOption(
        () => new Error("no document was found with the specified document id"),
      ),
      RTE.fromEither,
    ),
  ),
  // Mark document as "WAIT_FOR_VALIDATION"
  RTE.chainW(({ signatureRequest, document, ...ctx }) =>
    pipe(
      signatureRequest,
      startValidationOnDocument(document.id),
      RTE.fromEither,
      RTE.map((signatureRequest) => ({
        signatureRequest,
        document,
        ...ctx,
      })),
    ),
  ),
  RTE.chainW(
    ({
      signatureRequest,
      document: {
        metadata: { signatureFields },
      },
      meta,
    }) =>
      pipe(
        // Download the PDF document and save its content
        getUploadedDocument(meta.id),
        RTE.bindTo("documentContent"),

        // Open the PDF document and check its metadata
        RTE.bindW(
          "documentMetadata",
          ({ documentContent }) =>
            () =>
              getPdfMetadata(documentContent),
        ),

        RTE.chainFirstW(({ documentMetadata }) =>
          L.debugRTE("obtained pdf metadata", {
            documentMetadata,
            ...loggingContext(meta),
          }),
        ),
        // Validate document
        RTE.chainFirstW(({ documentContent, documentMetadata }) =>
          validateDocument(
            documentContent,
            documentMetadata,
            signatureFields,
            loggingContext(meta),
          ),
        ),
        // The uploaded PDF it's a valid Document for
        // the specified Signature Request. (mark as READY)
        RTE.chainW(({ documentMetadata }) =>
          pipe(
            getUploadedDocumentUrl(meta.id),
            RTE.fromReader,
            RTE.chainW(createDocumentFromUrl(meta.documentId)),
            RTE.chainEitherKW((url) =>
              pipe(
                signatureRequest,
                markDocumentAsReady(meta.documentId, url, documentMetadata),
              ),
            ),
            RTE.chainW(patchSignatureRequestDocument(meta.documentId)),
            // Update upload metadata and remove document
            // fromt temp storage
            RTE.chainW(() =>
              pipe(
                meta,
                markUploadMetadataAsValid,
                upsertUploadMetadata,
                RTE.chainFirstW(() =>
                  L.infoRTE("validation done", {
                    isDocumentValid: true,
                    ...loggingContext(meta),
                  }),
                ),
                RTE.map((meta) => meta.id),
                RTE.chainW(removeDocumentFromStorage),
              ),
            ),
            RTE.chainFirstW(() =>
              createAndSendAnalyticsEvent(EventName.DOCUMENT_UPLOADED)(
                signatureRequest,
              ),
            ),
          ),
        ),
        // Mark the document as REJECTED on error
        RTE.orElseW((e) =>
          pipe(
            signatureRequest,
            markDocumentAsRejected(meta.documentId, e.message),
            RTE.fromEither,
            RTE.chainW(patchSignatureRequestDocument(meta.documentId)),
            RTE.chainFirstW(() =>
              L.infoRTE("validation done", {
                isDocumentValid: false,
                ...loggingContext(meta),
              }),
            ),
            // Remove REJECTED file from temp storage
            RTE.chainW(() => removeDocumentFromStorage(meta.id)),
            RTE.chainFirstW(() =>
              createAndSendAnalyticsEvent(EventName.DOCUMENT_REJECTED)(
                signatureRequest,
              ),
            ),
          ),
        ),
      ),
  ),
);
