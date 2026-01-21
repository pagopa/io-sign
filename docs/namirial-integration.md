# Namirial QTSP Integration - io-func-sign-user

This document describes the integration with Namirial, the Qualified Trust Service Provider (QTSP) used for creating qualified electronic signatures in the io-func-sign-user Azure Function App.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Signature Creation Flow](#signature-creation-flow)
6. [QTSP Clauses & Metadata](#qtsp-clauses--metadata)
7. [Async Validation Flow](#async-validation-flow)
8. [Data Structures](#data-structures)
9. [Error Handling](#error-handling)
10. [Integration Points](#integration-points)

---

## Overview

Namirial is the QTSP that provides qualified electronic signature (QES) capabilities compliant with eIDAS regulation. The integration enables citizens to sign documents digitally through the IO app with legal validity equivalent to handwritten signatures.

### Key Capabilities

- **Qualified Electronic Signatures**: eIDAS-compliant digital signatures
- **PADES-LT Format**: Long-term validation PDF signatures
- **SPID Authentication**: Uses SPID SAML assertions for identity verification
- **Async Processing**: Queue-based signature validation for reliability

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NamirialApiBasePath` | Production API base URL | Yes |
| `NamirialUsername` | Production username (basic auth) | Yes |
| `NamirialPassword` | Production password (basic auth) | Yes |
| `NamirialTestApiBasePath` | Test environment API base URL | Yes |
| `NamirialTestUsername` | Test username | Yes |
| `NamirialTestPassword` | Test password | Yes |

### Configuration Structure

```typescript
interface NamirialConfig {
  prod: {
    basePath: string;
    username: string;
    password: string;
  };
  test: {
    basePath: string;
    username: string;
    password: string;
  };
  requestTimeoutMs: number; // Default: 5000ms
}
```

### Environment Selection

The integration supports dual environments (TEST/PROD) selected via:
- HTTP Header: `x-iosign-issuer-environment`
- Default: `TEST` if not specified

```typescript
// Environment selection logic
const config = issuerEnvironment === "TEST" 
  ? namirialConfig.test 
  : namirialConfig.prod;
```

---

## Authentication

### Token-Based Authentication

Namirial uses **Bearer Token Authentication** via credential exchange:

```mermaid
sequenceDiagram
    participant Client as io-sign (client)
    participant Namirial as Namirial (QTSP)
    
    Client->>Namirial: POST /api/token/<br/>Basic Auth (username:password)
    Namirial-->>Client: { access, refresh }
    
    Client->>Namirial: GET/POST with Bearer token
    Namirial-->>Client: Response
```

### Token Exchange

**Endpoint**: `POST {basePath}/api/token/`

**Request**:
```http
POST /api/token/ HTTP/1.1
Authorization: Basic base64(username:password)
Content-Type: application/json
```

**Response**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Token Usage

All subsequent API calls include the access token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Note**: Tokens are fetched fresh for each operation (no caching implemented).

---

## API Endpoints

### Namirial API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/token/` | Exchange credentials for access token |
| `GET` | `/api/tos/` | Retrieve QTSP Terms of Service and clauses |
| `POST` | `/api/requests/` | Create a new signature request |
| `GET` | `/api/requests/{id}` | Get signature request status |

### Client Functions

```typescript
// Token acquisition
makeGetToken(): (config: NamirialConfig) => TaskEither<Error, NamirialToken>

// Clauses retrieval
makeGetClauses(): (token: NamirialToken) => TaskEither<Error, ClausesMetadata>

// Signature request creation
makeCreateSignatureRequest(): (token: NamirialToken, body: CreateSignatureRequestBody) 
  => TaskEither<Error, SignatureRequest>

// Signature request status
makeGetSignatureRequest(): (token: NamirialToken, id: string) 
  => TaskEither<Error, SignatureRequest>
```

---

## Signature Creation Flow

### High-Level Flow

```mermaid
sequenceDiagram
    participant App as Client (IO App)
    participant Func as io-func-sign-user
    participant Nam as Namirial
    
    App->>Func: POST /signature-requests/{id}/signature
    
    Note over Func: Validate Lollipop params<br/>(SAML, public key, nonce)
    Note over Func: Get fiscal code (PDV)
    Note over Func: Get document URLs (Cosmos)
    
    Func->>Nam: POST /api/token/
    Nam-->>Func: { access, refresh }
    
    Func->>Nam: POST /api/requests/<br/>(signature payload)
    Nam-->>Func: { id, status: "CREATED" }
    
    Note over Func: Insert Signature (Cosmos)<br/>Update request → WAIT_QTSP<br/>Enqueue to qtspQueue
    
    Func-->>App: { signature_request_id }
```

### Detailed Steps

1. **Validate Input & Lollipop Parameters**
   - Verify SAML assertion from SPID
   - Extract public key and signature input
   - Validate nonce against QTSP clauses

2. **Retrieve Fiscal Code**
   - Call PDV Tokenizer with signer ID
   - Get citizen's fiscal code for Namirial

3. **Get Document URLs**
   - Query Cosmos DB for signature request documents
   - Retrieve filled document URLs from Blob Storage

4. **Build Signature Payload**
   - Encode public key as base64 JSON
   - Map document coordinates to Namirial format
   - Include SAML assertion and ToS signature

5. **Create Namirial Signature Request**
   - Authenticate with Namirial
   - POST signature request payload
   - Verify response status = `CREATED`

6. **Persist and Enqueue**
   - Insert Signature entity in Cosmos DB
   - Update SignatureRequest status → `WAIT_FOR_QTSP`
   - Enqueue message to `qtspQueue` for async validation

---

## QTSP Clauses & Metadata

### Clauses Retrieval

Before creating a signature, the client must retrieve and display QTSP terms:

**Endpoint**: `GET /qtsp/clauses`

**Flow**:

```mermaid
flowchart TB
    A[GET /api/tos/ - Namirial] --> B[ClausesMetadata]
    B --> C[QtspClausesMetadata - encoded]
    C --> D[Return to client]
```

### Clauses Metadata Structure

**Namirial Response**:
```typescript
interface ClausesMetadata {
  privacy_text: string;
  document_link: string;      // ToS document URL
  privacy_link: string;
  terms_and_conditions_link: string;
  clauses: Array<{ text: string }>;
  nonce: string;              // Critical: must be included in signature
}
```

**Encoded Response (to client)**:
```typescript
interface QtspClausesMetadata {
  documentUrl: string;
  privacyUrl: string;
  termsAndConditionsUrl: string;
  privacyText: string;
  clauses: Array<{ text: string }>;
  nonce: string;
}
```

### Nonce Importance

The `nonce` from clauses metadata is critical:
- Must be included in the signature request payload
- Prevents replay attacks
- Links ToS acceptance to specific signature request

---

## Async Validation Flow

### Queue-Based Processing

Signature validation is handled asynchronously via Azure Queue Storage:

```mermaid
sequenceDiagram
    participant CS as CreateSignature
    participant Q as qtspQueue
    participant VS as ValidateSignature
    participant Nam as Namirial
    
    CS->>Q: { signatureId, signerId }
    Q->>VS: Queue trigger
    VS->>Nam: GET /api/requests/{id}
    Nam-->>VS: { status: ... }
    Note over VS: Handle status
```

### Queue Message Structure

```typescript
interface SignatureNotification {
  signatureId: Id;
  signerId: Id;
}
```

### Status-Based Handling

| Namirial Status | Action | Result |
|-----------------|--------|--------|
| `CREATED` | Return retry error | Message re-queued |
| `WAITING` | Return retry error | Message re-queued |
| `READY` | Return retry error | Message re-queued |
| `COMPLETED` | Update docs, mark SIGNED | Success, send notification |
| `FAILED` | Extract error, mark FAILED | Failure, send notification |

### Validation Function Logic

```typescript
// Pseudo-code for ValidateSignature
async function validateSignature(message: SignatureNotification) {
  // 1. Get signature from Cosmos
  const signature = await getSignature(message.signatureId);
  
  // 2. Get token and poll Namirial
  const token = await getToken(config);
  const namirialRequest = await getSignatureRequest(token, signature.qtspSignatureRequestId);
  
  // 3. Handle status
  switch (namirialRequest.status) {
    case "CREATED":
    case "WAITING":
    case "READY":
      throw new RetryError(); // Re-queue for later
      
    case "COMPLETED":
      await updateDocumentsAsSigned(signature);
      await markSignatureRequestAsSigned(signature.signatureRequestId);
      await enqueueToSignedQueue(signature);
      break;
      
    case "FAILED":
      const reason = namirialRequest.last_error?.detail || "Unknown error";
      await markSignatureAsFailed(signature, reason);
      await enqueueToRejectedQueue(signature, reason);
      break;
  }
}
```

### Queue Architecture

```mermaid
flowchart TB
    subgraph qtsp["qtspQueue (waiting-for-qtsp)"]
        Q1_trigger["Trigger: CreateSignature success"]
        Q1_consumer["Consumer: ValidateSignature function"]
        Q1_payload["Payload: { signatureId, signerId }"]
    end
    
    subgraph signed["onSignedQueueClient (on-signature-request-signed)"]
        Q2_trigger["Trigger: Namirial status = COMPLETED"]
        Q2_consumer["Consumer: io-func-sign-issuer"]
    end
    
    subgraph rejected["onRejectedQueueClient (on-signature-request-rejected)"]
        Q3_trigger["Trigger: Namirial status = FAILED"]
        Q3_consumer["Consumer: io-func-sign-issuer"]
    end
```

---

## Data Structures

### Signature Entity

```typescript
interface Signature {
  id: Id;
  signerId: Id;
  signatureRequestId: Id;
  qtspSignatureRequestId: Id;  // Namirial request ID
  status: SignatureStatus;
  createdAt: Date;
  updatedAt: Date;
  rejectedReason?: string;
}

type SignatureStatus = 
  | "CREATED" 
  | "READY" 
  | "WAITING" 
  | "COMPLETED" 
  | "FAILED";
```

### Create Signature Request Payload

**Sent to Namirial**:
```typescript
interface CreateSignatureRequestBody {
  fiscal_code: FiscalCode;
  public_key: string;           // Base64-encoded
  SAML_assertion: string;       // Base64-encoded SPID assertion
  email: EmailString;
  document_link: string;        // Filled document URL
  nonce: string;                // From QTSP clauses
  tos_signature: string;        // Signed challenge
  signatures: {
    signed_challenge: string;
    signatures_type: "PADES";
    documents_to_sign: DocumentToSign[];
  };
  signature_input: string;      // Base64-encoded
}

interface DocumentToSign {
  url_in: string;               // Source document URL
  url_out: string;              // Signed document destination
  signature_fields: string[];   // Field names to sign
  signature_coordinates: SignatureCoordinate[];
  signatures_type: "PADES-LT";
  appearance_alias: "appio";
}

interface SignatureCoordinate {
  page: number;
  position: [x1: number, y1: number, x2: number, y2: number];
}
```

### Signature Request Response

**From Namirial**:
```typescript
interface SignatureRequest {
  id: string;                   // Namirial request ID
  created_at: string;           // ISO 8601 date
  status: NamirialStatus;
  last_error?: {
    code: number;
    detail: string;
  } | null;
}

type NamirialStatus = 
  | "CREATED" 
  | "READY" 
  | "WAITING" 
  | "COMPLETED" 
  | "FAILED";
```

### Certificate Model

```typescript
interface Certificate {
  status: string;
  serial_number: string;
  subject: string;
  issuer: string;
  valid_from: string;          // ISO 8601 date
  valid_to: string;            // ISO 8601 date
  data: string;                // PEM-encoded certificate
}
```

---

## Error Handling

### Error Types

| Error Type | Description | HTTP Status |
|------------|-------------|-------------|
| `HttpBadRequestError` | Invalid request format or API error | 400 |
| `ActionNotAllowedError` | Business logic violation | 409 |
| `EntityNotFoundError` | Resource not found | 404 |
| `RetryError` | Temporary error, retry later | N/A (internal) |

### Error Scenarios

| Scenario | Error Type | Handling |
|----------|-----------|----------|
| Token request fails | `HttpBadRequestError` | Logged, propagated to client |
| Invalid signature format | `HttpBadRequestError` | Validation error returned |
| Namirial returns error | `ActionNotAllowedError` | Error detail included in response |
| Status not CREATED after POST | `ActionNotAllowedError` | Transaction fails |
| Signature not found | `EntityNotFoundError` | 404 response |
| Invalid fiscal code | `EntityNotFoundError` | 404 response |
| Polling incomplete | `RetryError` | Message re-queued |
| Document not found | `Error` | Signature marked as FAILED |

### Namirial Error Response

When Namirial returns an error:
```json
{
  "id": "abc123",
  "status": "FAILED",
  "last_error": {
    "code": 1001,
    "detail": "Invalid SAML assertion"
  }
}
```

This error is captured and stored in the Signature entity's `rejectedReason` field.

### Retry Strategy

For async validation, the queue-based retry uses Azure Queue Storage's built-in retry:
- Failed validations throw `RetryError`
- Message remains in queue with visibility timeout
- Automatic retry with exponential backoff

---

## Integration Points

### 1. PDV Tokenizer

**Purpose**: Privacy-preserving identity management

**Operations**:
- Resolve signer ID to fiscal code
- Required for Namirial signature request

```typescript
// Get fiscal code for Namirial
const fiscalCode = await pdvTokenizer.getFiscalCode(signerId);
```

### 2. Lollipop API

**Purpose**: SPID authentication and assertion extraction

**Operations**:
- Extract SAML assertion from request
- Validate Lollipop signature
- Provide public key and signature input

```typescript
// Extract from request headers
const lollipopParams = {
  publicKey: request.headers["x-pagopa-lollipop-public-key"],
  samlAssertion: request.headers["x-pagopa-lollipop-assertion-ref"],
  signatureInput: request.headers["signature-input"],
  signature: request.headers["signature"]
};
```

### 3. Cosmos DB

**Containers**:
- `signatures`: Stores Signature entities
- `signature-requests`: Updates status during flow

**Operations**:
- Insert signature after Namirial request created
- Update signature status during validation
- Update signature request status (WAIT_FOR_QTSP → SIGNED/REJECTED)

### 4. Azure Blob Storage

**Containers**:
- `filled-modules`: Filled PDF documents (input to signing)
- `signed-documents`: Final signed PDFs (output from Namirial)

**SAS Tokens**: Time-limited URLs provided to Namirial for document access

### 5. Azure Queue Storage

**Queues**:
- `waiting-for-qtsp`: Async validation queue
- `on-signature-request-signed`: Completion notification
- `on-signature-request-rejected`: Failure notification

### 6. Event Hubs

**Analytics Events**:
- Signature creation events
- Validation success/failure events
- Performance metrics

---

## Health Checks

The integration includes health check capabilities:

```typescript
// Health check function
async function checkNamirialHealth(config: NamirialConfig): Promise<HealthStatus> {
  // 1. Test token acquisition
  const token = await getToken(config);
  
  // 2. Test ToS retrieval
  const clauses = await getClauses(token);
  
  // 3. Test link validity (HEAD requests)
  await checkUrl(clauses.document_link);
  await checkUrl(clauses.privacy_link);
  await checkUrl(clauses.terms_and_conditions_link);
  
  return { status: "healthy" };
}
```

**Checked Components**:
1. Token endpoint availability (`/api/token/`)
2. ToS endpoint availability (`/api/tos/`)
3. Document links validity (HEAD requests)

---

## Request Timeout

All HTTP calls to Namirial include a configurable timeout:

```typescript
const timeout = config.requestTimeoutMs || 5000; // Default 5 seconds

const response = await makeFetchWithTimeout(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
  timeout
});
```

---

## Sequence Diagram: Complete Flow

```mermaid
sequenceDiagram
    participant App as IO App
    participant Func as io-func-sign-user
    participant Nam as Namirial (QTSP)
    participant DB as Cosmos DB
    participant Q as Queues
    
    App->>Func: GET /qtsp/clauses
    Func->>Nam: POST /api/token/
    Nam-->>Func: { access }
    Func->>Nam: GET /api/tos/
    Nam-->>Func: { clauses, nonce }
    Func-->>App: { clauses }
    
    Note over App: User accepts ToS and signs
    
    App->>Func: POST /signature
    Func->>Nam: POST /api/token/
    Nam-->>Func: { access }
    Func->>Nam: POST /api/requests
    Nam-->>Func: { id, CREATED }
    Func->>DB: Insert Signature
    Func->>Q: Enqueue
    Func-->>App: { success }
    
    Q->>Func: Queue trigger
    Func->>Nam: GET /api/requests/{id}
    Nam-->>Func: { COMPLETED }
    Func->>DB: Update SIGNED
    Func->>Q: Notify issuer
```

---

## Summary

The Namirial QTSP integration provides:

1. **Qualified Electronic Signatures**: eIDAS-compliant digital signatures with legal validity
2. **Secure Authentication**: Token-based API access with Basic Auth credential exchange
3. **Async Processing**: Reliable queue-based validation for high availability
4. **Dual Environment**: Separate TEST/PROD configurations for development and production
5. **Comprehensive Error Handling**: Retry logic, error capture, and status tracking
6. **Full Audit Trail**: All signature operations tracked in Cosmos DB and Event Hubs

The integration ensures citizens can sign documents through the IO app with the same legal validity as handwritten signatures, while maintaining security, reliability, and compliance with Italian digital signature regulations.
