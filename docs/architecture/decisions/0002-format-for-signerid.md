# 2. Format for signer identifier

Date: 2022-05-12

## State

Proposed

## Context

We need to choose a format for the unique identifier of the Signer entity.

In the whole codebase of IO App backend, the Tax Number (_Codice Fiscale_) is
used to identify the IO App user.

We cannot use the Tax Number for the Signer ID since the GDPR and internal
PagoPA constraints require us to use the Personal Data Vault[^pdv] service
to store sensitive information about new service users (PII).

This brings us also the advantage of decoupling the Signer
from the IO App user, as we'll use an opaque ID for the entity.

Moreover, we don't have to write our storage to keep the lookup table
(Tax Number -> Signer ID).

## Decision

In the context of choosing a format for the identifier, facing the need of decoupling
the IO App generic user from the Signer entity and meeting PagoPA and GDPR constraints,
we decided to use an opaque identifier[^uid] (_uuid_) obtained from the Personal Data Vault
service[^pdvdr] and neglected to use the Tax Number as ID.

[^pdv]: https://pagopa.atlassian.net/wiki/spaces/usrreg/pages/480772446/Autenticazione+di+un+utente+nel+mio+sistema+tramite+SPID+CIE
[^uid]: https://pagopa.atlassian.net/wiki/spaces/LEG/pages/412354243/Re-engineering+UIDs
[^pdvdr]: https://pagopa.atlassian.net/wiki/spaces/usrreg/pages/480935948/Design+Review+-+Personal+Data+Vault
