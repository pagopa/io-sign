# 6. Use Vitest as Unit Test Framework

Date: 2023-04-18

## Status

Accepted

## Context

We realized that [Jest](https://jestjs.io/) no longer fits the needs of a modern TypeScript project.

The problems are many, but the most serious is the fact that Jest offers support for TypeScript through _third-party "transformers"_ that behave differently from the tools the project uses to compile TypeScript code. It often happens that code that compiles and works perfectly on the project, does not compile in the test framework.

## Decision

We chose to use [Vitest](https://vitest.dev/) that has a first-class support to TypeScript and uses `esbuild` (the same tool that we use to compile and bundle code in our project) behind the scenes.
