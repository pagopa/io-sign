ARG FUNCTION_NAME
# BuildKit performs static validation before args injection,
# so we need to set a default value to avoid build failures.
# We use a value that is unlikely to be used in practice in order to catch missing args.
ARG NODE_VERSION=__unset__

FROM node:${NODE_VERSION} AS base
RUN npm install -g pnpm@10.28.1
COPY . /usr/src/app


FROM base AS installer
ARG FUNCTION_NAME
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile
RUN pnpm exec nx run ${FUNCTION_NAME}:build


FROM node:${NODE_VERSION} AS functions-node
# Build ID and CLI version come from the CDN URL observed in azure-functions-core-tools@4 (latest).
# The CLI version (4.12.1+) ships a Node.js language worker that supports Node 24.
ARG FUNC_BUILD_ID=4.0.286861
ARG FUNC_CLI_VERSION=4.12.1
RUN apt-get update && \
    apt-get install -y --no-install-recommends unzip curl && \
    rm -rf /var/lib/apt/lists/* && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then FUNC_ARCH="linux-arm64"; else FUNC_ARCH="linux-x64"; fi && \
    curl -fsSL "https://cdn.functions.azure.com/public/${FUNC_BUILD_ID}/Azure.Functions.Cli.${FUNC_ARCH}.${FUNC_CLI_VERSION}.zip" \
        -o /tmp/func.zip && \
    unzip -q /tmp/func.zip -d /usr/local/func-cli && \
    chmod +x /usr/local/func-cli/func && \
    ln -sf /usr/local/func-cli/func /usr/local/bin/func && \
    rm /tmp/func.zip && \
    func --version


FROM functions-node AS runner
ARG FUNCTION_NAME
ENV AzureWebJobsScriptRoot=/usr/src/app \
  AzureFunctionsJobHost__Logging__Console__IsEnabled=true

WORKDIR /usr/src/app/apps/${FUNCTION_NAME}
COPY --from=installer /usr/src/app /usr/src/app

# Point the runtime to the current app folder in the monorepo
ENV AzureWebJobsScriptRoot=/usr/src/app/apps/${FUNCTION_NAME}

CMD ["func", "start", "--host", "0.0.0.0"]
