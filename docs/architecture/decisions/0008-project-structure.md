# 8. Project structure

Date: 2023-06-30

## Status

Accepted

## Context

`io-sign` is a system composed of several microservices, libraries, and frontends. These components are JavaScript projects built with TypeScript on Node.js. Therefore, from a technological standpoint, they are homogeneous.

This document aims to explain the structure of the codebase that we have adopted.

## Decision

We have made the decision to manage the entire codebase using a JavaScript monorepo, utilizing `yarn workspaces`. Below is a description of the folder structure of the project:

### Top-level files and folders

- `docs/`
- `apps/` - standalone applications, that will be deployed on cloud services (such as microservices or static web sites)
- `packages/` - modules meant to be included in other `packages` or `apps`
- `package.json`

### Workspace structure (without a framework)

In the case of workspaces that do not utilize opinionated frameworks like `Next.js` or `Angular`, it is recommended to adopt the `Hexagonal Architecture` (also known as Ports and Adapters Architecture) for organizing the codebase. 

This architectural pattern emphasizes the separation of concerns and promotes modular, testable, and maintainable code. The codebase should be structured into three layers:

1. **Domain Layer** This layer contains the entities, value objects, and aggregates that represent the core business logic of the system. It encapsulates the business rules and behaviors that drive the application. The domain layer should be independent of any specific infrastructure or framework.
2. **Application Layer**: The application layer is responsible for composing "operations" or use cases by orchestrating the interactions between different parts of the domain. It serves as the intermediary between the domain layer and the infrastructure layer. The application layer handles the business logic flow and defines the application-specific workflows and processes.
3. **Infrastructure Layer**: The infrastructure layer provides the implementation details and handles the interactions between the domain layer and external systems such as databases, HTTP controllers, or third-party services. This layer contains the code that glues the domain layer to the infrastructure components. It includes repositories, data access objects, API clients, and other infrastructure-related code.

Folder structure:

- `src/`
  - `app/` - application layer
    - `use-cases/`
      - `sample-action.ts`     
  - `infra/` - infrastructure layer
    - `http/`
      - `handlers/`
        - `sample-http-handler.ts`   
    - `azure/`
      - `functions/`
        - `sample-function.ts`   
      - `cosmos/`
        - `sample-cosmosdb-impl.ts`     
  - `sample-domain.ts` - domain layer
- `package.json`

### Other workspaces (with a framework)

Workspaces that use frameworks such as `Next.js` should follow their best practices and recommendation in terms of project structure.
