# Signature Request Lifecycle - io-func-sign-issuer

This document describes the complete lifecycle of a Signature Request in the io-func-sign-issuer Azure Function App, from creation through final completion (signed or rejected).

## Table of Contents

1. [Signature Request States](#signature-request-states)
2. [State Transition Flow](#state-transition-flow)
3. [Functions & Endpoints](#functions--endpoints)
4. [Business Rules & Validation](#business-rules--validation)
5. [Side Effects](#side-effects)
6. [Document Lifecycle](#document-lifecycle)
7. [Integration Points](#integration-points)

---

## Signature Request States

The system defines **7 distinct statuses** for a SignatureRequest:

| Status | Description | Required Data | Terminal State |
|--------|-------------|---------------|----------------|
| **DRAFT** | Initial state after creation; documents are awaiting upload & validation | `documents: Document[]` | No |
| **READY** | All documents validated and ready to sign | `documents: DocumentReady[]` | No |
| **WAIT_FOR_SIGNATURE** | Waiting for citizen to sign via QR code | `qrCodeUrl`, `documents: DocumentReady[]`, optional `notification` | No |
| **WAIT_FOR_QTSP** | _(Reserved)_ Waiting for QTSP server completion | `qrCodeUrl`, `documents: DocumentReady[]` | No |
| **SIGNED** | Successfully signed by citizen | `signedAt: Date`, `documents: DocumentReady[]`, optional `notification` | **Yes** |
| **REJECTED** | Signature failed/rejected by citizen | `rejectedAt: Date`, `rejectReason: string`, `qrCodeUrl`, `documents: DocumentReady[]` | **Yes** |
| **CANCELLED** | Issuer cancelled the request | `cancelledAt: Date`, `qrCodeUrl`, `documents: DocumentReady[]` | **Yes** |

### Key Characteristics

- **Terminal States**: SIGNED, REJECTED, and CANCELLED are immutable—once reached, no further transitions are allowed
- **Audit Trail**: All state transitions are persisted in Cosmos DB with timestamps
- **Data Evolution**: Required fields expand as the request progresses through states

---

## State Transition Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    SIGNATURE REQUEST LIFECYCLE                  │
└────────────────────────────────────────────────────────────────┘

                         CREATE SIGNATURE REQUEST
                                    │
                                    ▼
                            ┌───────────────┐
                            │     DRAFT     │
                            └───────┬───────┘
                                    │
                         All documents READY?
                                    │
                            MARK_AS_READY
                                    │
                                    ▼
                            ┌───────────────┐
                            │     READY     │
                            └───────┬───────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          MARK_AS_CANCELLED  MARK_AS_WAIT_FOR      │
                    │           SIGNATURE           │
                    │               │               │
                    ▼               ▼               │
            ┌───────────┐  ┌──────────────────┐    │
            │ CANCELLED │  │ WAIT_FOR_        │    │
            │           │  │ SIGNATURE        │    │
            └───────────┘  └────────┬─────────┘    │
                (Terminal)          │              │
                            ┌───────┼───────┐      │
                            │       │       │      │
                     MARK_AS_SIGNED │  MARK_AS_   │
                            │       │   REJECTED   │
                            ▼       ▼       ▼      │
                        ┌────────┐ ┌──────────┐   │
                        │ SIGNED │ │ REJECTED │   │
                        └────────┘ └──────────┘   │
                        (Terminal)   (Terminal)   │
                                                   │
                            Alternative Path:     │
                            Direct Cancellation ───┘
```

### State Transition Rules

| Current State | Allowed Transitions | Trigger |
|--------------|---------------------|---------|
| `DRAFT` | → `READY` | All documents validated |
| `READY` | → `WAIT_FOR_SIGNATURE` | Issuer marks as ready for signing |
| `READY` | → `CANCELLED` | Issuer cancels request |
| `WAIT_FOR_SIGNATURE` | → `SIGNED` | Citizen completes signature |
| `WAIT_FOR_SIGNATURE` | → `REJECTED` | Citizen rejects or error occurs |
| `WAIT_FOR_SIGNATURE` | → `CANCELLED` | Issuer cancels request |
| `SIGNED` | _(none)_ | Terminal state |
| `REJECTED` | _(none)_ | Terminal state |
| `CANCELLED` | _(none)_ | Terminal state |

**Key Constraints:**
- Cannot transition backward (e.g., READY → DRAFT is forbidden)
- Cannot modify requests in terminal states (SIGNED, REJECTED, CANCELLED)
- Only READY status can transition to WAIT_FOR_SIGNATURE

---

## Functions & Endpoints

### 1. Creation Phase

#### `CreateSignatureRequestHandler`
**Endpoint**: `POST /signature-requests`

**Purpose**: Creates a new signature request in DRAFT status

**Request Body**:
```json
{
  "dossier_id": "string (ULID)",
  "signer_id": "string (fiscal code)",
  "expires_at": "ISO 8601 date (optional, default: 90 days)",
  "documents_metadata": [
    {
      "document_id": "string (ULID)",
      "signature_fields": [...]
    }
  ]
}
```

**Validation**:
- ✓ Dossier must exist and belong to the authenticated issuer
- ✓ Signer must exist in PDV Tokenizer
- ✓ `expires_at` must be after creation date
- ✓ If `documents_metadata` provided, referenced documents must exist in dossier

**Side Effects**:
- Creates SignatureRequest in Cosmos DB with status `DRAFT`
- Emits `io.sign.signature_request.created` event to analytics EventHub
- Default expiry: 90 days from creation

**Response**: Returns created SignatureRequest object

---

### 2. Document Validation Phase

#### `ValidateUploadHandler`
**Trigger**: Azure Blob Storage (uploaded documents)

**Purpose**: Validates uploaded PDF documents and marks them READY or REJECTED

**Validation Steps**:
1. **PDF Signature Check**: File must start with `%PDF` magic number
2. **Signature Field Validation**:
   - **Existing fields**: Must exist in PDF form with exact `uniqueName`
   - **Fields to create**: 
     - Page number must exist
     - Coordinates (x, y) + dimensions (w, h) must fit within page boundaries

**Side Effects**:
- Updates document status to `READY` or `REJECTED`
- Emits events:
  - `io.sign.signature_request.document.uploaded` (success)
  - `io.sign.signature_request.document.rejected` (failure)

---

### 3. Status Transition Handlers

#### `SetSignatureRequestStatusHandler`
**Endpoint**: `PUT /signature-requests/{id}/status`

**Purpose**: Transitions request from DRAFT → READY or READY → CANCELLED

**Request Body**:
```json
{
  "status": "READY" | "CANCELLED"
}
```

**Validation**:
- For `READY`: All documents must have status = `READY`
- Cannot modify requests in terminal states

**Side Effects**:
- Updates SignatureRequest status in Cosmos DB
- **For READY**:
  - Enqueues message to `on-signature-request-ready` queue
  - Emits `io.sign.signature_request.ready` event to analytics
- **For CANCELLED**:
  - Sets `cancelledAt` timestamp
  - Enqueues to `waiting-for-signature-request-updates` queue

---

#### `MarkAsWaitForSignatureFunction`
**Trigger**: Azure Queue Storage (`on-signature-request-wait-for-signature`)

**Purpose**: Transitions READY → WAIT_FOR_SIGNATURE

**Queue Message**:
```typescript
{
  signatureRequestId: string,
  qrCodeUrl: string, // Generated by io-func-sign-user
  // ... other SignatureRequestToBeSigned fields
}
```

**Side Effects**:
- Updates SignatureRequest in Cosmos DB:
  - Status → `WAIT_FOR_SIGNATURE`
  - Adds `qrCodeUrl` field
- No events emitted (handled by user service)

---

#### `CloseSignatureRequestFunction`
**Triggers**: 
- Azure Queue Storage: `on-signature-request-signed`
- Azure Queue Storage: `on-signature-request-rejected`

**Purpose**: Transitions WAIT_FOR_SIGNATURE → SIGNED or REJECTED

**Queue Message (SIGNED)**:
```typescript
{
  signatureRequestId: string,
  signedAt: Date,
  // ... other SignatureRequestSigned fields
}
```

**Queue Message (REJECTED)**:
```typescript
{
  signatureRequestId: string,
  rejectedAt: Date,
  reason: string,
  // ... other SignatureRequestRejected fields
}
```

**Side Effects**:

**For SIGNED**:
- Updates status → `SIGNED`, sets `signedAt` timestamp
- Sends citizen notification via IO Services:
  - Title: "I documenti che hai firmato sono pronti!"
  - Message: Documents available for 90 days
- Emits events:
  - `io.sign.signature_request.signed` (analytics EventHub)
  - `SIGNATURE_SIGNED` (billing EventHub) with pricing plan
- Notification tracking:
  - `io.sign.signature_request.notification.sent` (success)
  - `io.sign.signature_request.notification.rejected` (failure)

**For REJECTED**:
- Updates status → `REJECTED`, sets `rejectedAt` and `rejectReason`
- Sends citizen notification via IO Services:
  - Title: "C'è un problema con la firma"
  - Message: Issuer will contact to retry
- Emits event: `io.sign.signature_request.rejected` (analytics EventHub)
- Sends telemetry to AppInsights (sampling disabled)
- Notification tracking (same as SIGNED)

---

## Business Rules & Validation

### Request-Level Validation

1. **Temporal Constraints**:
   - `expires_at` must be after `created_at`
   - Default expiry: 90 days from creation
   - Requests cannot be modified after expiry

2. **Ownership & Access**:
   - Dossier must belong to authenticated issuer
   - Only issuer who created request can modify it

3. **Signer Validation**:
   - Signer must exist in PDV Tokenizer
   - Fiscal code format validated

4. **Document Metadata**:
   - Referenced documents must exist in dossier
   - Document IDs must be valid ULIDs

### State Machine Constraints

1. **Forward-Only Progression**:
   - States can only move forward in lifecycle
   - No backward transitions allowed (e.g., READY → DRAFT forbidden)

2. **Terminal State Immutability**:
   - SIGNED, REJECTED, CANCELLED cannot be modified
   - Attempting to update returns `409 Conflict`

3. **Ready State Requirements**:
   ```typescript
   canBeMarkedAsReady(): boolean {
     return this.documents.every(doc => doc.status === "READY");
   }
   ```

4. **Signature Preparation**:
   - Only requests with status `READY` can transition to `WAIT_FOR_SIGNATURE`
   - QR code must be generated before transition

### Document Validation Rules

1. **PDF Format**:
   - File must start with `%PDF` magic number
   - Must be valid PDF/A format

2. **Signature Field Validation**:
   
   **For Existing Fields**:
   ```typescript
   - Field with exact `uniqueName` must exist in PDF form
   - Field type must support signatures
   ```
   
   **For Fields to Create**:
   ```typescript
   - Page number must be ≥ 1 and ≤ total pages
   - bottom_left.x + bottom_left.y must be ≥ 0
   - size.w + size.h must be > 0
   - Signature field must fit within page boundaries:
       x + w ≤ page_width
       y + h ≤ page_height
   ```

3. **Document Count**:
   - At least one document required
   - Maximum documents: not explicitly limited but constrained by dossier

---

## Side Effects

### Azure Storage Queues

| Queue Name | Triggered By | Message Content | Consuming Service |
|------------|--------------|-----------------|-------------------|
| `on-signature-request-ready` | SetSignatureRequestStatus (READY) | `SignatureRequestReady` | io-func-sign-user |
| `on-signature-request-wait-for-signature` | io-func-sign-user | `SignatureRequestToBeSigned` (includes QR) | io-func-sign-issuer |
| `on-signature-request-signed` | io-func-sign-user | `SignatureRequestSigned` | io-func-sign-issuer |
| `on-signature-request-rejected` | io-func-sign-user | `SignatureRequestRejected` | io-func-sign-issuer |
| `waiting-for-signature-request-updates` | SetSignatureRequestStatus (CANCELLED) | `SignatureRequestCancelled` | _(processing TBD)_ |

### Event Hubs

#### Analytics EventHub (`analytics`)
Tracks all lifecycle events for data lake and reporting:

```typescript
// Event Types
"io.sign.signature_request.created"           // DRAFT created
"io.sign.signature_request.ready"             // → READY
"io.sign.signature_request.signed"            // → SIGNED
"io.sign.signature_request.rejected"          // → REJECTED
"io.sign.signature_request.cancelled"         // → CANCELLED
"io.sign.signature_request.document.uploaded" // Document validated
"io.sign.signature_request.document.rejected" // Document failed
"io.sign.signature_request.notification.sent" // IO notification success
"io.sign.signature_request.notification.rejected" // IO notification failed
```

**Event Payload Example**:
```json
{
  "eventType": "io.sign.signature_request.signed",
  "timestamp": "2026-01-21T10:00:00Z",
  "signatureRequestId": "01HQXYZ...",
  "dossierId": "01HQABC...",
  "issuerId": "12345678901",
  "signerId": "RSSMRA80A01H501U",
  "documentsCount": 2,
  "signedAt": "2026-01-21T09:58:30Z"
}
```

#### Billing EventHub (`billing`)
**Only for SIGNED requests**—captures billable events:

```json
{
  "eventType": "SIGNATURE_SIGNED",
  "signatureRequestId": "01HQXYZ...",
  "issuerId": "12345678901",
  "signedAt": "2026-01-21T09:58:30Z",
  "pricingPlan": "FREE" | "DEFAULT" | "INTERNAL",
  "documentsCount": 2
}
```

**Pricing Plan Logic**:
- `INTERNAL`: Test environment (non-production)
- `FREE`: First N signatures (quota-based)
- `DEFAULT`: Standard billing

### IO Services Notifications

Sent to citizens via IO platform on terminal states:

#### SIGNED Notification
```
Subject: I documenti che hai firmato sono pronti!
Body: 
  Puoi scaricarli e conservarli.
  Hai 90 giorni di tempo prima che vengano eliminati.
```

#### REJECTED Notification
```
Subject: C'è un problema con la firma
Body:
  L'ente che ti ha inviato la richiesta ti contatterà
  per farti riprovare a firmare.
```

**Notification Tracking**:
- Success → `io.sign.signature_request.notification.sent` event
- Failure → `io.sign.signature_request.notification.rejected` event

### Telemetry (Application Insights)

**REJECTED State Only**:
```typescript
trackEvent("SignatureRequestRejected", {
  signatureRequestId: "01HQXYZ...",
  reason: "User declined",
  environment: "production"
}, { samplingDisabled: true });
```

---

## Document Lifecycle

Each document within a signature request has its own sub-lifecycle:

```
┌──────────────────────────────────────────────────────────┐
│              DOCUMENT STATUS LIFECYCLE                    │
└──────────────────────────────────────────────────────────┘

                    DOCUMENT CREATED
                           │
                           ▼
                  ┌─────────────────┐
                  │ WAIT_FOR_UPLOAD │
                  └────────┬─────────┘
                           │
                   File uploaded to
                   Azure Blob Storage
                           │
                           ▼
              ┌─────────────────────────┐
              │ WAIT_FOR_VALIDATION     │
              └───────────┬─────────────┘
                          │
                ValidateUpload
                   Function
                          │
          ┌───────────────┴───────────────┐
          │                               │
    Validation                       Validation
      Success                          Failed
          │                               │
          ▼                               ▼
    ┌─────────┐                   ┌──────────┐
    │  READY  │                   │ REJECTED │
    └─────────┘                   └──────────┘
   (Can sign)                    (Cannot sign)
```

### Document Status Definitions

| Status | Description | Next Action |
|--------|-------------|-------------|
| `WAIT_FOR_UPLOAD` | Document metadata created, awaiting file upload | Upload PDF to blob storage |
| `WAIT_FOR_VALIDATION` | File uploaded, validation in progress | Automatic validation |
| `READY` | Document validated, ready for signing | Wait for all docs to be READY |
| `REJECTED` | Validation failed (invalid PDF or signature fields) | Re-upload or fix metadata |

### Signature Request → Document Relationship

A signature request can only transition to `READY` when **all documents** are `READY`:

```typescript
class SignatureRequest {
  canBeMarkedAsReady(): boolean {
    return this.documents.length > 0 && 
           this.documents.every(doc => doc.status === "READY");
  }
}
```

---

## Integration Points

### 1. Cosmos DB
**Container**: `signature-requests`

**Operations**:
- `CREATE`: New signature request (DRAFT)
- `READ`: Get request by ID, query by status/dossier
- `UPDATE`: All state transitions
- `DELETE`: _(Not used—soft delete via status)_

**Indexes**:
- `dossierId` (for listing requests by dossier)
- `signerId` (for user queries)
- `status` (for filtering)
- `createdAt`, `expiresAt` (for temporal queries)

### 2. Azure Blob Storage
**Containers**:
- `uploaded-documents`: Raw PDFs uploaded by issuers
- `validated-documents`: PDFs after validation
- `signed-documents`: Final signed PDFs with digital signature

**SAS Tokens**: Time-limited access URLs generated for uploads

### 3. Azure Queue Storage
**Message Flow**:
```
issuer-func → [on-signature-request-ready] → user-func
user-func → [on-signature-request-wait-for-signature] → issuer-func
user-func → [on-signature-request-signed] → issuer-func
user-func → [on-signature-request-rejected] → issuer-func
```

### 4. Event Hubs
**Analytics Pipeline**:
- Real-time event streaming to data lake
- Used for dashboards, reporting, and auditing

**Billing Pipeline**:
- Captures SIGNED events for invoicing
- Integrates with financial systems

### 5. PDV Tokenizer
**Purpose**: Privacy-preserving identity management

**Operations**:
- Validate signer fiscal code
- Resolve signer personal data (name, email)
- Tokenize PII for storage

### 6. IO Services
**Purpose**: Citizen notification platform

**Operations**:
- Send push notifications to IO app
- Send email notifications (fallback)
- Track notification delivery status

### 7. Application Insights
**Telemetry**:
- Performance metrics (function execution time)
- Error tracking (validation failures, API errors)
- Custom events (rejections with high priority)

---

## Example: Complete Lifecycle Flow

### Scenario: Issuer creates a contract signature request

```
1. POST /signature-requests
   ├─ Status: DRAFT
   ├─ Documents: [contract.pdf] → WAIT_FOR_UPLOAD
   └─ Event: io.sign.signature_request.created

2. Issuer uploads contract.pdf to Blob Storage
   ├─ Blob trigger → ValidateUploadHandler
   ├─ Validation: PDF signature ✓, signature fields ✓
   ├─ Document status → READY
   └─ Event: io.sign.signature_request.document.uploaded

3. PUT /signature-requests/{id}/status → READY
   ├─ Validation: All documents READY ✓
   ├─ Status: READY
   ├─ Queue: Enqueued to on-signature-request-ready
   └─ Event: io.sign.signature_request.ready

4. io-func-sign-user processes queue message
   ├─ Generates QR code URL
   ├─ Queue: Enqueued to on-signature-request-wait-for-signature
   └─ (User can now scan QR and sign)

5. MarkAsWaitForSignatureFunction (queue trigger)
   ├─ Status: WAIT_FOR_SIGNATURE
   └─ Adds qrCodeUrl to request

6. Citizen scans QR code and signs via IO app
   ├─ io-func-sign-user creates digital signature
   ├─ Queue: Enqueued to on-signature-request-signed
   └─ (Signature complete)

7. CloseSignatureRequestFunction (queue trigger)
   ├─ Status: SIGNED
   ├─ Sets signedAt timestamp
   ├─ Notification: Sent to citizen via IO
   ├─ Event: io.sign.signature_request.signed (analytics)
   ├─ Event: SIGNATURE_SIGNED (billing)
   └─ Event: io.sign.signature_request.notification.sent

✓ Lifecycle Complete
```

---

## Summary

The Signature Request lifecycle in `io-func-sign-issuer` is a robust, event-driven state machine that:

1. **Enforces strict state transitions** with validation at each step
2. **Maintains immutable audit trails** via Cosmos DB and Event Hubs
3. **Handles asynchronous processing** through Azure Queue Storage
4. **Integrates multiple services** (PDV, IO, QTSP) for complete workflow
5. **Tracks analytics and billing** for compliance and financial reporting
6. **Notifies citizens** at key milestones (signed/rejected)

The architecture ensures **compliance with digital signature regulations** while providing **scalability** and **observability** through Azure's event-driven infrastructure.
