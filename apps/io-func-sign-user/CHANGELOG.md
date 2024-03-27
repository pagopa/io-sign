# io-func-sign-user

## 0.6.0

### Minor Changes

- a42eca9: Updated GetThirdPartyMessageDetails function

## 0.5.1

### Patch Changes

- cea4a45: Changed SignatureInput regex

## 0.5.0

### Minor Changes

- 59caea4: Track REJECTED request, code refactor

### Patch Changes

- Updated dependencies [59caea4]
  - @io-sign/io-sign@1.3.0

## 0.4.4

### Patch Changes

- Updated dependencies [bdc1236]
  - @io-sign/io-sign@1.2.0

## 0.4.3

### Patch Changes

- Updated dependencies [a0cea83]
  - @io-sign/io-sign@1.1.0

## 0.4.2

### Patch Changes

- Updated dependencies [2bbef78]
  - @io-sign/io-sign@1.0.6

## 0.4.1

### Patch Changes

- Updated dependencies [45c91d2]
  - @io-sign/io-sign@1.0.5

## 0.4.0

### Minor Changes

- 0a888ab: add x-firmaconio-environment header to http responses related to signature requests

## 0.3.6

### Patch Changes

- 29ee473: update to node 18

## 0.3.5

### Patch Changes

- 60a5170: configure host logging properties to monitor execution on app insight

## 0.3.4

### Patch Changes

- Updated dependencies [f154adc]
  - @io-sign/io-sign@1.0.4

## 0.3.3

### Patch Changes

- Updated dependencies [286e6c2]
  - @io-sign/io-sign@1.0.3

## 0.3.2

### Patch Changes

- 95d2a1e: Add analytics events
- c83bdb2: Changed the type of signature from PADES-T to PADES-LT
- Updated dependencies [95d2a1e]
- Updated dependencies [95d2a1e]
  - @io-sign/io-sign@1.0.2

## 0.3.1

### Patch Changes

- aeef66f: Fix default QTSP environment

## 0.3.0

### Minor Changes

- f6e7581: Add GetSignatureRequests function
- e9c71c9: Added logging to the create-signature http handler
- e456d1b: - Added headers required by lollipop to `createSignature`
  - Added lollipop infrastructure for API access
  - Added SPID assertion retrieval via lollipop API
  - Implemented forwarding of parameters to QTSP
- 76f46cc: Added health-check on the whole infra. [SFEQS-1273]
  `makeFetchWithTimeout` has been moved to the `io-sign` package.
- d660dec: Added a configuration parameter to switch to the QTSP test environment, in order to test signatures.
- a562450: Add signature mock to create a valid signature for QTSP and fix some errors
- 78ae07d: Added support for REJECTED status for signature request. [SFEQS-1277]
  Added a preliminary status check before signature creation
- a0a818d: expand signature request to include issuer e-mail and description
- c5e932d: Add dossier title to Signature Request
- 8afb588: Implement endpoints for third party message attachments
- 1794895: Add functions to sync Signature Request statuses across the system

### Patch Changes

- 41a9f7e: Added lollipop parameters to openapi
- 30923e9: Added department field to issuer and created INTERNAL pricing plan
- 12100f7: Added custom SAML mock and implement getFieldValue in PDF infra
- 769c7e3: Added support for console log in host.json
- 3e00bff: Notification send refactor
  [SFEQS-1323,1329] Fixed sent notification messages
  [SFEQS-1325] Bug fix on updatedAt field
  [SFEQS-1311] Bug fix multiple notifications
- 1a2b4c6: Add filename extension to ThirdPartyMessageApiModel
- a562450: Add base64 url encoded for createFilledDocument
- 027b1d0: Fixed public key encoding
- ec71e65: pre-authenticate urls on signed signature requests (issuer)
- 9a80b6f: Added lollipop mock
- 22fee87: Add WAIT_FOR_QTSP status to signature request
- 072f30f: Change extensionBundle
- d1f4f7e: Set maxPollingInterval for queues to 5 seconds
- fc69f72: Changed notification message
- a9e668e: [SFEQS-1238] round coordinates for QTSP
- 8afb588: Moved `getDocument` and `SignatureRequestDraft` to @io-sign package
- c3f6683: - Added deleteBlobIfExist in io-sign package
  - Added deletion of previous filledDocument in createFilledDocument
- Updated dependencies [045b0eb]
- Updated dependencies [8bbb0d6]
- Updated dependencies [c5e2774]
- Updated dependencies [e456d1b]
- Updated dependencies [30923e9]
- Updated dependencies [12100f7]
- Updated dependencies [76f46cc]
- Updated dependencies [a1fb3ed]
- Updated dependencies [7cc0178]
- Updated dependencies [3e00bff]
- Updated dependencies [e9c71c9]
- Updated dependencies [e6a3334]
- Updated dependencies [6a3d7b6]
- Updated dependencies [5481a80]
- Updated dependencies [ea5efd4]
- Updated dependencies [78ae07d]
- Updated dependencies [a0a818d]
- Updated dependencies [ec71e65]
- Updated dependencies [22fee87]
- Updated dependencies [c5e932d]
- Updated dependencies [62f8a61]
- Updated dependencies [8afb588]
- Updated dependencies [8afb588]
- Updated dependencies [c3f6683]
- Updated dependencies [2e646fd]
  - @io-sign/io-sign@1.0.0

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
