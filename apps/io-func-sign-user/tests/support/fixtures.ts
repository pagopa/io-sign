import { IncomingMessage } from "node:http";
import { StubHandler } from "./stubs";

// ─── Namirial QTSP stub ───────────────────────────────────────────────────────
export const namirialStubHandler: StubHandler = (req: IncomingMessage) => {
  const url = req.url ?? "";

  // POST /namirial/api/token/ — auth token (NamirialToken = { access, refresh })
  if (url.includes("/token") && req.method === "POST") {
    return {
      status: 200,
      body: {
        access: "test-namirial-access-token",
        refresh: "test-namirial-refresh-token"
      }
    };
  }

  // GET /namirial/api/requests/:id — get signature request status
  if (url.includes("/requests") && req.method === "GET") {
    return {
      status: 200,
      body: {
        id: "qtsp-request-id",
        created_at: new Date().toISOString(),
        status: "COMPLETED",
        last_error: null
      }
    };
  }

  // POST /namirial/api/requests/ — create signature request
  if (url.includes("/requests") && req.method === "POST") {
    return {
      status: 200,
      body: {
        id: "qtsp-request-id-new",
        created_at: new Date().toISOString(),
        status: "CREATED",
        last_error: null
      }
    };
  }

  return { status: 200, body: {} };
};

// ─── PDV Tokenizer stub ──────────────────────────────────────────────────────
export const pdvTokenizerStubHandler: StubHandler = (req: IncomingMessage) => {
  const url = req.url ?? "";

  // PUT /pdv/tokens — get or create token for fiscal code
  if (url.includes("/tokens") && req.method === "PUT") {
    return {
      status: 200,
      body: { token: "pdv-signer-token-id" }
    };
  }

  // GET /pdv/tokens/:id/pii — get fiscal code by token
  if (url.includes("/pii")) {
    return {
      status: 200,
      body: { pii: "TINIT-RSSMRA80A01H501U" }
    };
  }

  return { status: 200, body: {} };
};

// ─── Lollipop API stub ───────────────────────────────────────────────────────
export const lollipopStubHandler: StubHandler = () => ({
  status: 200,
  body: {
    response: {
      status: 200,
      body: Buffer.from(
        "<saml:Assertion>test-assertion</saml:Assertion>"
      ).toString("base64")
    }
  }
});

// ─── IO Services API stub ────────────────────────────────────────────────────
export const ioServicesStubHandler: StubHandler = (req: IncomingMessage) => {
  const url = req.url ?? "";

  // POST /io-services/profiles — check if user exists
  if (url.includes("/profiles")) {
    return {
      status: 200,
      body: { sender_allowed: true }
    };
  }

  return { status: 200, body: {} };
};

// ─── Test data factories ─────────────────────────────────────────────────────

/**
 * A valid DocumentReady conforming to the io-ts schema:
 * { id, metadata: { title, signatureFields, pdfDocumentMetadata }, createdAt, updatedAt, status: "READY", uploadedAt, url }
 */
export function makeTestDocumentReady(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    metadata: {
      title: "Test Document",
      signatureFields: [
        {
          attributes: { uniqueName: "sig_field_1" },
          clause: { title: "Required clause for testing", type: "REQUIRED" }
        }
      ],
      pdfDocumentMetadata: {
        pages: [{ number: 0, width: 595, height: 842 }],
        formFields: [{ type: "PDFSignature", name: "sig_field_1" }]
      }
    },
    createdAt: now,
    updatedAt: now,
    uploadedAt: now,
    url: "https://example.com/documents/test-doc.pdf",
    status: "READY",
    ...overrides
  };
}

export function makeTestSignature(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    signerId: generateId(),
    signatureRequestId: generateId(),
    qtspSignatureRequestId: generateId(),
    status: "WAITING",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function makeTestSignatureRequest(
  overrides: Record<string, unknown> = {}
) {
  const now = new Date().toISOString();
  const signerId = overrides.signerId ?? generateId();
  return {
    id: generateId(),
    dossierId: generateId(),
    dossierTitle: "Test Dossier Title",
    issuerId: generateId(),
    issuerEmail: "issuer@test.pagopa.it",
    issuerDescription: "Test Issuer",
    issuerInternalInstitutionId: generateId(),
    issuerEnvironment: "TEST",
    issuerDepartment: "",
    signerId,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    status: "WAIT_FOR_SIGNATURE",
    documents: [makeTestDocumentReady()],
    qrCodeUrl: "https://static.pagopa.it/qrcode.png",
    ...overrides
  };
}

function generateId(): string {
  return [...Array(26)]
    .map(
      () => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[Math.floor(Math.random() * 32)]
    )
    .join("");
}
