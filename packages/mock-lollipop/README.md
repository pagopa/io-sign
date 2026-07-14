# @io-sign/mock-lollipop

Local mock of the Lollipop API used by `io-sign` for development.

Available endpoints:

- `GET /lollipop/api/v1/assertions/:assertionRef`
  - Returns a fixed `{ response_xml }` payload containing a minimal (not cryptographically valid) SAML-like assertion. Sufficient for local development, since downstream QTSP calls are also mocked and do not validate the assertion content.
- `HEAD /` — returns `200`, used by the health check.

Run in development mode:

```bash
cd packages/mock-lollipop
pnpm install
pnpm dev
```

Build and start:

```bash
pnpm --filter @io-sign/mock-lollipop build
pnpm --filter @io-sign/mock-lollipop start
```

Environment variables:
- `PORT` — port to listen on (default: `3012`).

Logs are printed to stdout to help debugging incoming requests.