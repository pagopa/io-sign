# @io-sign/io-sign

## 0.9.1

### Patch Changes

- 12100f7: Added custom SAML mock and implement getFieldValue in PDF infra
- 78ae07d: Added support for REJECTED status for signature request. [SFEQS-1277]
  Added a preliminary status check before signature creation
- 22fee87: Add WAIT_FOR_QTSP status to signature request

## 0.9.0

### Minor Changes

- deb99dd: [SFEQS-1204, SFEQS-1214] Implement `CreateSignatureRequest`, `GetSignatureRequest`, `MarkAsWaitForSignature` Azure Functions

### Patch Changes

- 336cd7a: document state machine now correctly resets state-specific attributes [SFEQS-1146]
