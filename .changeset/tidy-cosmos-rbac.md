---
"@io-sign/io-sign": patch
"io-func-sign-issuer": patch
"io-func-sign-user": patch
"io-func-sign-support": patch
"io-sign-backoffice-func": patch
---

Require only the Cosmos DB credentials for the selected authentication mode,
allowing Azure connection string settings to be removed while preserving local
connection-string authentication.
