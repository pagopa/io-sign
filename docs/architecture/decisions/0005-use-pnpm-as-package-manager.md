# 5. Use pnpm as a package manager

Date: 2022-11-30

## Status

Accepted

## Context

We found out that using `pnpm workspaces` for managing multiple packages in a monorepo has a big and non-accettable drawback: it creates a singular, flat-structured `node_modules` in the workspace root instead of dedicated `node_modules` folder for each workspace.

Since we are deploying our services as "standalone node projects", the cloud platform we are using doesn't have the right context (workspace-level) to resolve correctly all the dependencies.

This local-production disparity causes **bugs and unexpected behaviour** on deploy that slows our feedback loop.

## Decision

In order to avoid the problems described in the "_Context_" chapter, we decided to change the package manager used and move on `pnpm` that allows us to hoist dependencies maintaining at the same time a "local" `node_modules` folder for each workspace project.
