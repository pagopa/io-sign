# 1. Use PNPM as a package manager

Date: 2022-11-30

## Status

Accepted

## Context

We found out that using `npm workspaces` for managing multiple packages in a monorepo has a big and non-accettable drawback: all dependencies are hoisted to the root directory, so every workspace package has access to ALL dependencies, even if they are not listed in the workspace package's `package.json` file.

The root-level `node_modules` flat-directory, moreover, is not used in online environemnt because the PAAS we are using require us to ship only the "project folder" as a standalone node package - so, we can't use `npm workspaces` utilities to manage dependencies project dependencies in production.

This local-production disparity causes **bugs and unexpected behaviour** on deploy.

## Decision

In order to avoid the problems described in the "Context" chapter, we decided to change the package manager used and move on `pnpm` that allows us to hoist dependencies maintaining at the same time a "local" node_modules folder for each workspace project.
