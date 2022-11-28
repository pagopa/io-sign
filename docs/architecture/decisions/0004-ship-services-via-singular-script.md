# 4. Ship services via a singular JS entry point

Date: 2022-11-28

## Status

Accepted

## Context

Our system is made up of services (written as an Azure Function App), which include several Azure Functions running on the Node.js runtime and are distributed via a specific JS script file as an entry point.

We experienced that this approach has two major drawbacks:

1. There are a lot of repetitions in the codebase, to set up the connections for the backing services like Cosmos DB o the API client of the IO platform. These repetitions forced us to use some anti-patterns (i.e. using "effectful" js modules as singletons).

2. The Azure Node.js runtime by default will run a dedicated Node process for each JS script file provided. In some contexts, this behavior is preferable, because it allows to isolate each function but it consumes more memory and prevents us to share runtime objects appropriately.

## Decision

We decided to ship our services via a singular JS entry point, that bundles together all the Azure Functions defined
