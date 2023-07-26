FROM node:18-alpine AS base

FROM base AS builder

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
COPY . .
RUN yarn set version berry
RUN yarn dlx turbo prune --scope=io-sign-backoffice-ca --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=builder /app/.yarnrc.yml ./yarnrc.yml
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo run build --filter=io-sign-backoffice-ca...

FROM base AS runner
LABEL org.opencontainers.image.source=https://github.com/pagopa/io-sign
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/io-sign-backoffice-ca/next.config.js .
COPY --from=installer --chown=nextjs:nodejs /app/apps/io-sign-backoffice-ca/.next/standalone/node_modules ./node_modules
COPY --from=installer --chown=nextjs:nodejs /app/apps/io-sign-backoffice-ca/.next/standalone/apps/io-sign-backoffice-ca .
COPY --from=installer --chown=nextjs:nodejs /app/apps/io-sign-backoffice-ca/.next/static .next/static

CMD node server.js