ARG MOCK_NAME
# BuildKit performs static validation before args injection,
# so we need to set a default value to avoid build failures.
# We use a value that is unlikely to be used in practice in order to catch missing args.
ARG NODE_VERSION=__unset__

FROM node:${NODE_VERSION} AS base
RUN npm install -g pnpm@10.28.1
COPY . /usr/src/app


FROM base AS installer
ARG MOCK_NAME
WORKDIR /usr/src/app
RUN pnpm install
RUN pnpm exec nx run "@io-sign/${MOCK_NAME}:build"


FROM node:${NODE_VERSION} AS runner
ARG MOCK_NAME
WORKDIR /usr/src/app/packages/${MOCK_NAME}
COPY --from=installer /usr/src/app /usr/src/app

CMD ["node", "dist/server.js"]
