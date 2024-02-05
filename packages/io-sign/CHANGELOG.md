# @io-sign/io-sign

## 1.0.6

### Patch Changes

- 2bbef78: Add configuration_id to submitMessageforUserWithFiscalCodeInBody

## 1.0.5

### Patch Changes

- 45c91d2: submitMessageForUser now sends ADVANCED messages

## 1.0.4

### Patch Changes

- f154adc: Exclude text fields from PDF metadata

## 1.0.3

### Patch Changes

- 286e6c2: Added `signerId` to billing and analytics events.

## 1.0.2

### Patch Changes

- 95d2a1e: Add analytics events
- 95d2a1e: Adds a try-catch to the pdf-lib library to avoid unhandled errors.

## 1.0.1

### Patch Changes

- 46dabe7: Adds a try-catch to the pdf-lib library to avoid unhandled errors.

## 1.0.0

### Major Changes

- e6a3334: BREAKING CHANGE: Added `formFields` attribute to `DocumentMetadata` in `io-sign` package
  [SFEQS-1266] Added validation of signature fields and pages during `ValidateUpload` in `io-func-sign-issuer`
  [SFEQS-1216] Fixed infra dependencies

### Minor Changes

- 8bbb0d6: Add io-func-sign-support service
- c5e2774: Added self-care integration
- 76f46cc: Added health-check on the whole infra. [SFEQS-1273]
  `makeFetchWithTimeout` has been moved to the `io-sign` package.
- a1fb3ed: Added analytics event implementation for datalake
- 7cc0178: Add vatNumber field to issuer
- 5481a80: Require at least one mandatory signature for each dossier
- a0a818d: expand signature request to include issuer e-mail and description
- c5e932d: Add dossier title to Signature Request
- 2e646fd: Added billing event

### Patch Changes

- 045b0eb: Added third_party_data to notification
- e456d1b: - Added headers required by lollipop to `createSignature`
  - Added lollipop infrastructure for API access
  - Added SPID assertion retrieval via lollipop API
  - Implemented forwarding of parameters to QTSP
- 30923e9: Added department field to issuer and created INTERNAL pricing plan
- 12100f7: Added custom SAML mock and implement getFieldValue in PDF infra
- 3e00bff: Notification send refactor
  [SFEQS-1323,1329] Fixed sent notification messages
  [SFEQS-1325] Bug fix on updatedAt field
  [SFEQS-1311] Bug fix multiple notifications
- e9c71c9: Added utility function to log through console
- 6a3d7b6: fix minor bugs on REST API serialization and error responses
- ea5efd4: Add client utils to @io-sign
- 78ae07d: Added support for REJECTED status for signature request. [SFEQS-1277]
  Added a preliminary status check before signature creation
- ec71e65: pre-authenticate urls on signed signature requests (issuer)
- 22fee87: Add WAIT_FOR_QTSP status to signature request
- 62f8a61: Add environment to issuer data model
- 8afb588: Implement endpoints for third party message attachments
- 8afb588: Moved `getDocument` and `SignatureRequestDraft` to @io-sign package
- c3f6683: - Added deleteBlobIfExist in io-sign package
  - Added deletion of previous filledDocument in createFilledDocument

## 0.9.0

### Minor Changes

- deb99dd: [SFEQS-1204, SFEQS-1214] Implement `CreateSignatureRequest`, `GetSignatureRequest`, `MarkAsWaitForSignature` Azure Functions

### Patch Changes

- 336cd7a: document state machine now correctly resets state-specific attributes [SFEQS-1146]
