# io-sign ✍️

[![Code Review](https://github.com/pagopa/io-sign/actions/workflows/code-review.yaml/badge.svg?branch=main)](https://github.com/pagopa/io-sign/actions/workflows/code-review.yaml)

`io-sign` is the [IO platform](https://io.italia.it) _feature_ that allows citizens to sign digitally documents and contracts sent by public administration.

This repository contains the code that composes the `io-sign` back-end, that is organized into two microservices:

1. `io-func-sign-issuer` that exposes the API used by public entities
2. `io-func-sign-user` that exposes the ReST API consumed by the [IO mobile app](https://github.com/pagopa/io-app)

These services are deployed as `Azure Function App`, and use the `Node.js` Azure runtime.

It also contains `io-sign-backoffice-app` the frontend for self-care integration.

## Prerequisites

In order to run the `io-sign` back-end/front-end locally you need the following tool installed on your machine.

- `Node.js 20`
- `pnpm 10.28.1`

The preferred way to set up the local environment is using [nodenv](https://github.com/nodenv/nodenv) to manage `Node.js` installation and `corepack` (included with `Node.js`) to manage the installation of `pnpm`.

## Backend local development

To test the `Azure Functions` locally:

1. **Setup the Environment Variables.** Create a file called `local.settings.json` in each `Azure Functions App` folder (`./apps/*`) valued according to the environment variables listed in `local.settings.json.example`.

2. **Install the project.** Run from the root folder the following commands.

```bash
# to install the dependencies
pnpm

# to generate the TypeScript models based on OpenAPI specs
pnpm -r run generate:api-models

# to build all projects
pnpm build
```

## Frontend local development

To test the `webapp` locally:

1. **Install the project (if you haven't already).** Run from the root folder the following commands.

```bash
# to install the dependencies
pnpm

# to build all projects
pnpm build
```

2. **Run the Web App**. Run (from the root folder) the following command

```bash
pnpm --filter io-sign-backoffice-app dev
```

## Release management

This project uses [changesets](https://github.com/changesets/changesets) to automate updating package versions, and changelogs.

Each Pull Request that includes changes that require a version bump should include a `changeset` file that describe that changes.

To create a new `changeset` file run the following command from the project root:

```bash
pnpm changeset
```

## Useful commands

This project uses `pnpm@10.28.1` with workspaces to manage projects and dependencies. Here is a list of useful commands to work in this repo.

### Work with workspaces

```bash
# to execute COMMAND on WORKSPACE_NAME
pnpm --filter WORKSPACE_NAME run command

# to execute COMMAD on all workspaces
pnpm -r run command

# run unit tests on @io-sign/io-sign
pnpm --filter @io-sign/io-sign run test

# run the typecheck script on all workspaces
pnpm -r run typecheck

# generate the API models for all workspaces
pnpm -r run generate:api-models
```

### Add dependencies

```bash
# add a dependency to the workspace root
pnpm add turbo

# add a jest as dev dependency on @io-sign/io-sign
pnpm --filter @io-sign/io-sign add -D jest

# add io-ts as dependency on each workspace
pnpm -r add io-ts
```

### Build the backend deployment package (for upload on Azure)

This command generates a deployment package (`ZIP`), in the workspace folder, with bundled dependencies, ready to be deployed on Azure.

```bash
pnpm --filter WORKSPACE_NAME run build:package

# example
pnpm --filter io-func-sign-issuer run build:package
```

### Build the frontend deployment package (for upload on Azure)

This command generates static frontend files inside the `.next` folder which can then be uploaded to a static website:

```bash
pnpm --filter io-sign-backoffice-app run build
```

## LICENSING

For detailed information regarding the licensing of this project please take
a look at the [LICENSE](LICENSE) file.
