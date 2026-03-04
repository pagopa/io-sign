# @io-sign/mock-namirial

Local mock of the Namirial (QTSP) API used by `io-sign` for development and tests.

Available endpoints (mounted under `/api`):

- `POST /api/token`
  - Returns a token object: `{ access, refresh }`.
- `GET /api/tos`
  - Returns a `ClausesMetadata` JSON with `nonce`, `clauses`, `document_link`, `privacy_link`, `terms_and_conditions_link`.
- `POST /api/requests`
  - Creates a mock signature request; returns `{ id, created_at, status: "CREATED", last_error: null }` with HTTP 201.
- `GET /api/requests/:id`
  - First call: returns the request with `status: "WAITING"`.
  - Subsequent call with the same id: returns `status: "COMPLETED"`.
- `GET /documents/privacy.pdf` — returns a minimal PDF payload.
- `GET /privacy` — returns a minimal HTML privacy page.
- `GET /terms` — returns a minimal HTML terms page.

Run in development mode:

```bash
cd packages/mock-namirial
pnpm install
pnpm dev
```

Build and start:

```bash
pnpm --filter @io-sign/mock-namirial build
pnpm --filter @io-sign/mock-namirial start
```

Environment variables:
- `PORT` — port to listen on (default: `3010`).

Logs are printed to stdout to help debugging incoming requests.
