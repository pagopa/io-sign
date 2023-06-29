# 7. Use turborepo as task manager

Date: 2023-06-26

## Status

Accepted

## Context

Since we are working on a multi-project codebase we need a tool that helps us running tasks (such as build, test) across the projects.
`yarn` and `npm` in `workspace` mode,

Since we are working on a multi-project codebase, we need a tool that allows us to execute tasks (such as build, code review or test) across projects.

We need a tool that:

- is easy to install and maintain, and compatible to `yarn workspaces`
- allows us to execute tasks across the projects
- can executes task in parallel
- can cache the results of task execution
- works on CI

The package manager we use (`yarn`) supports a subset of such use-cases, so we need to choose between two different (external) tools.

### Option 1: Nx

`nx` is the de-facto standard for managing multi-project codebases in JavaScript. It has a vibrant community and lots of documentation, it has been stable for several years.

It supports all the listed use-cases, but it's scope is more broader: it manages dependencies, versioning, scaffolding, tests and is proposed in the market as the "all-in" tool to manage monorepos.

https://nx.dev/

### Option 2: Turborepo

`turbo` is a task manager for multi-project codebase developed by Vercel. Is a new project, which is getting a lot of visibility in the JavaScript community. It supports the required use cases, but doesn't do much else: it's just a task manager.

https://turbo.build/repo

## Decision

Using `nx` would mean delegating too many tasks to this tool and would "lock" our codebase to its development. We prefer to have direct control over all aspects of codebase management and not delegate them to a single tool, so we decided to use `turbo` which, if in the future it does not fit our needs, can be replaced like all the other tools (such as `vitest` or `tsup`).
