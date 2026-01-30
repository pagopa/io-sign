# IO-Sign Agents Architecture

This document describes the Azure Functions (agents) that compose the io-sign backend system. The architecture is organized into four main microservices, each deployed as an Azure Function App.

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐
│  Public Entities    │     │   IO Mobile App     │
│  (Issuers)          │     │   (Citizens)        │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ io-func-sign-issuer │     │ io-func-sign-user   │
│  (Issuer API)       │     │  (User API)         │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐
│ io-func-sign-support│     │io-sign-backoffice   │
│  (Support API)      │     │  (Admin API)        │
└─────────────────────┘     └─────────────────────┘
```

## 1. io-func-sign-issuer

**Purpose**: Exposes the API used by public entities (issuers) to create dossiers and manage signature requests.

**Version**: 0.20.0

### Functions

#### Dossier Management
- **`CreateDossier`** (POST `/dossiers`)
  - Creates a new dossier for organizing signature requests
  
- **`GetDossier`** (GET `/dossiers/{id}`)
  - Retrieves dossier details by ID
  
- **`GetRequestsByDossier`** (GET `/dossiers/{id}/signature-requests`)
  - Lists all signature requests associated with a dossier

#### Signature Request Lifecycle
- **`CreateSignatureRequest`** (POST `/signature-requests`)
  - Creates a new signature request for a citizen
  
- **`GetSignatureRequest`** (GET `/signature-requests/{id}`)
  - Retrieves signature request details
  
- **`SetSignatureRequestStatus`** (PUT `/signature-requests/{id}/status`)
  - Updates the status of a signature request
  
- **`MarkAsWaitForSignature`** (POST `/signature-requests/{id}/wait-for-signature`)
  - Marks a request as ready for citizen signature
  
- **`MarkAsRejected`** (POST `/signature-requests/{id}/reject`)
  - Marks a signature request as rejected
  
- **`MarkAsSigned`** (POST `/signature-requests/{id}/signed`)
  - Marks a signature request as completed/signed

#### Document Management
- **`ValidateUpload`** (POST `/uploads/{id}/validate`)
  - Validates uploaded documents
  
- **`ValidateDocument`** (POST `/documents/validate`)
  - Validates document structure and content
  
- **`GetUploadUrl`** (POST `/uploads`)
  - Generates a SAS URL for document upload

#### User Management
- **`GetSignerByFiscalCode`** (POST `/signers`)
  - Retrieves signer information by fiscal code

#### Notifications
- **`SendNotification`** (POST `/notifications`)
  - Sends notifications to citizens via IO

#### Issuer Management
- **`CreateIssuer`** (POST `/issuers`)
  - Creates a new issuer in the system
  
- **`CreateIssuerByVatNumberView`** (GET `/issuers/{vatNumber}`)
  - Creates issuer by VAT number (view endpoint)

#### Utility
- **`Info`** (GET `/info`)
  - Returns service health and version information

### Key Integrations
- **Cosmos DB**: `dossiers`, `signature-requests`, `uploads` containers
- **Storage Blob**: `uploaded-documents`, `validated-documents`, `signed-documents`
- **Queue Storage**: `on-signature-request-ready`, `waiting-for-signature-request-updates`
- **Event Hubs**: `billing`, `analytics`, SelfCare contracts
- **External APIs**: PDV Tokenizer, IO Services, BackOffice API

---

## 2. io-func-sign-user

**Purpose**: Exposes the REST API consumed by the IO mobile app, allowing citizens to view and sign documents.

**Version**: 0.8.0

### Functions

#### Signature Request Operations
- **`GetSignatureRequest`** (GET `/signature-requests/{id}`)
  - Retrieves signature request details for a citizen
  
- **`GetSignatureRequests`** (GET `/signature-requests`)
  - Lists all signature requests for the authenticated citizen
  
- **`CreateSignatureRequest`** (POST `/signature-requests`)
  - Creates a new signature request (internal operation)
  
- **`UpdateSignatureRequest`** (PATCH `/signature-requests/{id}`)
  - Updates signature request status or data

#### Document Filling
- **`CreateFilledDocument`** (POST `/filled-documents`)
  - Initiates document filling process
  
- **`FillDocument`** (POST `/signature-requests/{id}/fill`)
  - Fills document fields with citizen data

#### Signature Creation
- **`CreateSignature`** (POST `/signature-requests/{id}/signature`)
  - Creates a digital signature for a document
  
- **`ValidateQtspSignature`** (POST `/qtsp/validate`)
  - Validates signature created by QTSP (Qualified Trust Service Provider)

#### User Data
- **`GetSignerByFiscalCode`** (POST `/signers`)
  - Retrieves signer information
  
- **`GetQtspClausesMetadata`** (GET `/qtsp/clauses`)
  - Retrieves QTSP terms and conditions metadata

#### IO Messages Integration
- **`GetThirdPartyMessageDetails`** (GET `/messages/{id}`)
  - Retrieves message details from IO platform
  
- **`GetThirdPartyMessageAttachmentContent`** (GET `/messages/{id}/attachments/{attachmentId}`)
  - Retrieves message attachment content

#### Utility
- **`Info`** (GET `/info`)
  - Returns service health and version information

### Key Integrations
- **Cosmos DB**: `signature-requests` container
- **Storage Blob**: `filled-modules`, `validated-documents`, `signed-documents`
- **Queue Storage**: `waiting-for-documents-to-fill`, `waiting-for-qtsp`, `on-signature-request-wait-for-signature`, `on-signature-request-signed`, `on-signature-request-rejected`
- **Event Hub**: `analytics`
- **External APIs**: PDV Tokenizer, IO Services, Lollipop API, Namirial (QTSP)

---

## 3. io-func-sign-support

**Purpose**: Provides read-only support functions for querying signature request status and troubleshooting.

**Version**: 1.4.0

### Functions

- **`GetSignatureRequest`** (POST `/signature-requests/query`)
  - Queries signature request details by various parameters
  - Used by support teams for troubleshooting

- **`Info`** (GET `/info`)
  - Returns service health and version information

### Key Integrations
- Minimal dependencies, primarily read-only queries to existing data stores

---

## 4. io-sign-backoffice-func

**Purpose**: Administrative backend operations for managing issuers and API keys, integrated with SelfCare platform.

**Version**: 1.4.0

### Functions

- **`health`** (GET `/health`)
  - Health check endpoint
  
- **`getApiKey`** (GET `/api-keys/{id}`)
  - Retrieves API key for an institution
  - Used for issuer authentication
  
- **`onSelfcareContractsMessage`** (Event Hub Trigger)
  - Processes SelfCare contract change events
  - Automatically updates issuer subscriptions

### Key Integrations
- **Cosmos DB**: `api-keys` collection with leases
- **Event Hub**: SelfCare contracts (trigger)
- **Google Sheets**: Integration via `googleapis`
- **External APIs**: SelfCare API, Google Auth

---

## Technology Stack

### Runtime & Framework
- **Runtime**: Node.js 20 with Azure Functions runtime
- **Framework**: `@azure/functions` v4 with `@pagopa/handler-kit-azure-func`
- **Language**: TypeScript

### Data Storage
- **Cosmos DB**: Primary data store for dossiers, signature requests, API keys
- **Azure Blob Storage**: Document storage (uploaded, validated, signed)
- **Azure Queue Storage**: Asynchronous job processing

### Messaging & Events
- **Azure Event Hubs**: Analytics, billing, and cross-service events

### External Integrations
- **PDV Tokenizer**: User identity management
- **IO Services**: Citizen notification platform
- **Namirial**: Qualified Trust Service Provider (QTSP) for digital signatures
- **Lollipop API**: Additional security layer
- **SelfCare**: Public administration subscription management

---

## Deployment

Each Azure Function App is independently deployable:

```bash
# Build deployment package for a specific function app
yarn workspace WORKSPACE_NAME run build:package

# Examples:
yarn workspace io-func-sign-issuer run build:package
yarn workspace io-func-sign-user run build:package
yarn workspace io-func-sign-support run build:package
yarn workspace io-sign-backoffice-func run build:package
```

The build process creates a ZIP file with bundled dependencies ready for Azure deployment.

---

## Development

### Environment Setup
Each Azure Function App requires a `local.settings.json` file in its directory. See `local.settings.json.example` in each app folder for required configuration.

### Local Testing
```bash
# Install dependencies
yarn

# Generate API models
yarn workspaces foreach run generate:api-models

# Build all projects
yarn build

# Run specific function app locally
yarn workspace WORKSPACE_NAME start
```

---

## Architecture Patterns

### Handler Kit Pattern
All functions use `@pagopa/handler-kit-azure-func` for:
- Consistent error handling
- Request validation
- Response formatting
- Logging and monitoring

### Repository Pattern
Data access is abstracted through repository classes in the `@io-sign/io-sign` package:
- `DossierRepository`
- `SignatureRequestRepository`
- `UploadRepository`
- `ApiKeyRepository`

### Queue-Based Processing
Asynchronous operations use Azure Queue Storage:
- Document validation
- QTSP signature processing
- Status updates
- Notification sending

### Event-Driven Architecture
Event Hubs enable:
- Analytics tracking
- Billing events
- Cross-service communication
- SelfCare integration

---

## Security

- **Authentication**: API key-based for issuer API, citizen authentication via IO platform
- **Authorization**: Function-level authorization checks
- **Data Protection**: PDV Tokenizer for PII management
- **Document Security**: Azure Blob Storage with SAS tokens for time-limited access
- **Qualified Signatures**: Integration with certified QTSP (Namirial)
