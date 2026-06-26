ARG FUNCTION_NAME
# BuildKit performs static validation before args injection,
# so we need to set a default value to avoid build failures.
# We use a value that is unlikely to be used in practice in order to catch missing args.
ARG NODE_VERSION=__unset__

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
COPY . /usr/src/app


FROM base AS installer
ARG FUNCTION_NAME
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile
RUN pnpm exec nx run ${FUNCTION_NAME}:build


FROM node:${NODE_VERSION} AS functions-node
RUN npm i -g azure-functions-core-tools@4 --unsafe-perm true


FROM functions-node AS runner
ARG FUNCTION_NAME
ENV AzureWebJobsScriptRoot=/usr/src/app \
  AzureFunctionsJobHost__Logging__Console__IsEnabled=true

WORKDIR /usr/src/app/apps/${FUNCTION_NAME}
COPY --from=installer /usr/src/app /usr/src/app

# Point the runtime to the current app folder in the monorepo
ENV AzureWebJobsScriptRoot=/usr/src/app/apps/${FUNCTION_NAME}

CMD ["func", "start", "--host", "0.0.0.0"]
