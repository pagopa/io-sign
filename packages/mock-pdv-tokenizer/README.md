# @io-sign/mock-pdv-tokenizer

Local mock of the PDV Tokenizer API used by `io-sign` for development.

Available endpoints:

- `PUT /tokenizer/v1/tokens`
  - Body: `{ pii }`. Returns `{ token }` (a stable UUID, generated once per `pii` and reused on subsequent calls).
- `POST /tokenizer/v1/tokens/search`
  - Body: `{ pii }`. Returns `{ token }` if already tokenized, `404` otherwise.
- `GET /tokenizer/v1/tokens/:token/pii`
  - Returns `{ pii }` if the token is known, `404` otherwise.
- `HEAD /` — returns `200`, used by the health check.

The mapping between `pii` and `token` is kept in memory and is not persisted across restarts.

Run in development mode:

```bash
cd packages/mock-pdv-tokenizer
pnpm install
pnpm dev
```

Build and start:

```bash
pnpm --filter @io-sign/mock-pdv-tokenizer build
pnpm --filter @io-sign/mock-pdv-tokenizer start
```

Environment variables:
- `PORT` — port to listen on (default: `3013`).

Logs are printed to stdout to help debugging incoming requests.