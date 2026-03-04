# @io-sign/mock-io-services

Local mock of the IO Services API used by `io-sign` for development and tests.

Available endpoints (mounted under `/api` and `/api/v1`):

- `GET /api/profiles/:fiscalCode` (or `/api/v1/profiles/:fiscalCode`)
  - Returns a minimal profile object: `{ fiscal_code, sender_allowed }`.
  - `sender_allowed` is `false` when the fiscal code starts with `X` (mock behavior).
- `POST /api/messages` (or `/api/v1/messages`)
  - Accepts a JSON body with the message payload (or `{ message: ... }`).
  - Minimal validation: the object must include `fiscal_code`.
  - Returns `201` with `{ id }` on success.
- Health checks: `HEAD /`, `HEAD /api`, `HEAD /api/v1` return `200`.

Run in development mode:

```bash
cd packages/mock-io-services
pnpm install
pnpm dev
```

Build and start:

```bash
pnpm --filter @io-sign/mock-io-services build
pnpm --filter @io-sign/mock-io-services start
```

Environment variables:
- `PORT` or `MOCK_IO_SERVICES_PORT` — port to listen on (default: `3011`).

Logs are printed to stdout to help debugging incoming requests.
