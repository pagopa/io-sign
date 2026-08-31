import { describe, it, expect, vi } from "vitest";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  PdfDocumentMetadata,
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes,
} from "@io-sign/io-sign/document";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { validate } from "@io-sign/io-sign/validation";

import {
  validateExistingSignatureField,
  validateSignatureFieldToBeCreated,
} from "../validate-upload";

const pdfDocumentMetadata: PdfDocumentMetadata = {
  pages: [
    {
      number: 0 as NonNegativeNumber,
      width: 200 as NonNegativeNumber,
      height: 800 as NonNegativeNumber,
    },
  ],
  formFields: [
    { type: "PDFSignature", name: "fieldId1" },
    { type: "PDFSignature", name: "fieldId2" },
  ],
};

describe("validateExistingSignatureField", () => {
  it.each([
    {
      payload: {
        uniqueName: "fieldId1" as NonEmptyString,
      },
      expected: true,
    },
    {
      payload: {
        uniqueName: "fieldNotPresent" as NonEmptyString,
      },
      expected: false,
    },
  ])("should be valid ($#)", ({ payload, expected }) => {
    const data = pipe(
      payload,
      validate(SignatureFieldAttributes),
      E.chainW((attr) =>
        pipe(pdfDocumentMetadata, validateExistingSignatureField("test", attr))
      ),
      E.isRight
    );
    expect(data).toBe(expected);
  });
});

describe("validateSignatureFieldToBeCreated", () => {
  it.each([
    {
      payload: {
        coordinates: {
          x: 10 as NonNegativeNumber,
          y: 10 as NonNegativeNumber,
        },
        page: 0 as NonNegativeNumber,
        size: {
          w: 80 as NonNegativeNumber,
          h: 20 as NonNegativeNumber,
        },
      },
      expected: true,
    },
    {
      payload: {
        coordinates: {
          x: 10 as NonNegativeNumber,
          y: 10 as NonNegativeNumber,
        },
        page: 0 as NonNegativeNumber,
        size: {
          w: 1000 as NonNegativeNumber,
          h: 1000 as NonNegativeNumber,
        },
      },
      expected: false,
    },
    {
      payload: {
        coordinates: {
          x: 10 as NonNegativeNumber,
          y: 10 as NonNegativeNumber,
        },
        page: 6 as NonNegativeNumber,
        size: {
          w: 80 as NonNegativeNumber,
          h: 20 as NonNegativeNumber,
        },
      },
      expected: false,
    },
  ])("should be valid ($#)", ({ payload, expected }) => {
    const data = pipe(
      payload,
      validate(SignatureFieldToBeCreatedAttributes),
      E.chainW((attr) =>
        pipe(
          pdfDocumentMetadata,
          validateSignatureFieldToBeCreated("test", attr)
        )
      ),
      E.isRight
    );
    expect(data).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// validateUpload — event emission
// ---------------------------------------------------------------------------

vi.mock("@io-sign/io-sign/infra/pdf", () => ({
  getPdfMetadata: vi.fn(),
}));

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { newId } from "@io-sign/io-sign/id";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { getPdfMetadata } from "@io-sign/io-sign/infra/pdf";
import { EventName, SignEventsProducerClient } from "@io-sign/io-sign/sign-event";
import { UploadMetadata, UploadMetadataRepository, FileStorage } from "../../../upload";
import { SignatureRequest, SignatureRequestRepository } from "../../../signature-request";
import { validateUpload } from "../validate-upload";

const issuerId = newId();
const documentId = newId();

const signatureRequest: SignatureRequest = {
  id: newId(),
  issuerId,
  issuerEmail: "test@example.com" as EmailString,
  issuerDescription: "Test Issuer" as NonEmptyString,
  issuerInternalInstitutionId: newId(),
  issuerEnvironment: "TEST",
  issuerDepartment: "dep1" as NonEmptyString,
  signerId: newId(),
  dossierId: newId(),
  dossierTitle: "Test Dossier" as NonEmptyString,
  // DRAFT: the only status where START_DOCUMENT_VALIDATION is allowed
  status: "DRAFT",
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000),
  documents: [
    {
      id: documentId,
      status: "WAIT_FOR_UPLOAD",
      metadata: {
        title: "doc #1" as NonEmptyString,
        signatureFields: [] as unknown as NonEmptyString,
        pdfDocumentMetadata: { pages: [], formFields: [] },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
} as unknown as SignatureRequest;

const uploadMetadata: UploadMetadata = {
  id: newId(),
  documentId,
  signatureRequestId: signatureRequest.id,
  issuerId,
  createdAt: new Date(),
  updatedAt: new Date(),
  validated: false,
};

const uploadMetadataRepository: UploadMetadataRepository = {
  get: (_id) => TE.right(O.some(uploadMetadata)),
  upsert: (meta) => TE.right(meta),
};

const signatureRequestRepository: SignatureRequestRepository = {
  get: (_id, _issuerId) => TE.right(O.some(signatureRequest)),
  upsert: (req) => TE.right(req),
  patchDocument: (req, _docId) => TE.right(req),
  findByDossier: () => Promise.reject(new Error("not implemented")),
  insert: () => TE.left(new Error("not implemented")),
};

// no-op storage stubs
const uploadedFileStorage: FileStorage = {
  exists: () => TE.right(true),
  download: () => TE.right(Buffer.alloc(0)),
  createFromUrl: (_url, _name) => TE.right(""),
  remove: (_name) => TE.right(void 0),
  getUrl: (_name) => TE.right("https://blob.example.com/upload"),
};

const validatedFileStorage: FileStorage = {
  exists: () => TE.right(true),
  download: () => TE.right(Buffer.alloc(0)),
  createFromUrl: (_url, _name) => TE.right("https://blob.example.com/validated"),
  remove: (_name) => TE.right(void 0),
  getUrl: (_name) => TE.right(""),
};

const makeSignEventsClient = () => {
  const tryAdd = vi.fn().mockReturnValue(true);
  const sendBatch = vi.fn().mockResolvedValue(undefined);
  const signEventsClient: SignEventsProducerClient = {
    createBatch: vi.fn().mockResolvedValue({ tryAdd }),
    sendBatch,
    close: vi.fn().mockResolvedValue(undefined),
  };
  return { signEventsClient, tryAdd, sendBatch };
};

const logger = { log: () => () => void 0 };

describe("validateUpload", () => {
  it("sends a DOCUMENT_REJECTED event when the PDF is invalid", async () => {
    vi.mocked(getPdfMetadata).mockReturnValue(
      TE.left(new Error("invalid PDF"))
    );
    const { signEventsClient, tryAdd } = makeSignEventsClient();

    await validateUpload(uploadMetadata.id, Buffer.from("INVALID"))({
      uploadMetadataRepository,
      signatureRequestRepository,
      uploadedFileStorage,
      validatedFileStorage,
      signEventsClient,
      logger,
    })();

    expect(tryAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          eventName: EventName.DOCUMENT_REJECTED,
        }),
      })
    );
  });

  it("sends a DOCUMENT_UPLOADED event when the PDF is valid", async () => {
    vi.mocked(getPdfMetadata).mockReturnValue(
      TE.right({ pages: [{ number: 0, width: 100, height: 100 }], formFields: [] })
    );
    const { signEventsClient, tryAdd } = makeSignEventsClient();

    // Buffer must start with "%PDF" to pass the magic-byte check in validateDocument
    await validateUpload(uploadMetadata.id, Buffer.from("%PDF-fake"))({
      uploadMetadataRepository,
      signatureRequestRepository,
      uploadedFileStorage,
      validatedFileStorage,
      signEventsClient,
      logger,
    })();

    expect(tryAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          eventName: EventName.DOCUMENT_UPLOADED,
        }),
      })
    );
  });
});
