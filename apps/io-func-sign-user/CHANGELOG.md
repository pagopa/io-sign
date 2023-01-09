# io-func-sign-user

## 0.3.0

### Minor Changes

- a562450: Add signature mock to create a valid signature for QTSP and fix some errors
- 78ae07d: Added support for REJECTED status for signature request. [SFEQS-1277]
  Added a preliminary status check before signature creation

### Patch Changes

- 12100f7: Added custom SAML mock and implement getFieldValue in PDF infra
- a562450: Add base64 url encoded for createFilledDocument
- 22fee87: Add WAIT_FOR_QTSP status to signature request
- fc69f72: Changed notification message
- a9e668e: [SFEQS-1238] round coordinates for QTSP
- Updated dependencies [12100f7]
- Updated dependencies [78ae07d]
- Updated dependencies [22fee87]
  - @io-sign/io-sign@0.9.1

## 0.2.0

### Minor Changes

- b6d4d87: [SFEQS-1208, SFEQS-1156] Implement CreateSignature and ValidateQtspSignature endpoint
- deb99dd: [SFEQS-1204, SFEQS-1214] Implement `CreateSignatureRequest`, `GetSignatureRequest`, `MarkAsWaitForSignature` Azure Functions

### Patch Changes

- bd627ee: [SFEQS-1218] Added required fields to QtspClausesMetadataDetailView openapi
- 324e2b5: [SFEQS-1217] Added location header to `createFilledDocument` endpoint
- Updated dependencies [336cd7a]
- Updated dependencies [deb99dd]
  - @io-sign/io-sign@0.9.0
