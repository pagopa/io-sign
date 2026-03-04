ARG MOCK_NAME
# BuildKit performs static validation before args injection,
# so we need to set a default value to avoid build failures.
# We use a value that is unlikely to be used in practice in order to catch missing args.
ARG NODE_VERSION=__unset__

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
COPY . /usr/src/app


FROM base AS builder
ARG MOCK_NAME
WORKDIR /usr/src/app
RUN pnpm dlx turbo@^2.5.5 prune @io-sign/${MOCK_NAME} --docker


FROM node:${NODE_VERSION} AS installer
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/out/json/ .
RUN pnpm install
COPY --from=builder /usr/src/app/out/full/ .
RUN pnpm --filter @io-sign/${MOCK_NAME} build


FROM node:${NODE_VERSION} AS runner
ARG MOCK_NAME
WORKDIR /usr/src/app/packages/${MOCK_NAME}
COPY --from=installer /usr/src/app /usr/src/app

CMD ["node", "dist/server.js"]
