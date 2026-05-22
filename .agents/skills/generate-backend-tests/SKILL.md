---
name: generate-backend-tests
description: Create, refactor, or extend backend test workflows for Node.js or TypeScript services using real runtimes, Testcontainers-managed dependencies, optional reachable cloud services from .env.test, and progressive routing into integration or record-replay coverage. Use this whenever the user asks for integration tests, live contract coverage, freeze-before-refactor workflows, VCR or golden-master tests, cassette capture/verify flows, Azure Functions harnesses, replacing mock-heavy backend tests with real coverage, or adding more scenarios onto an existing backend-test harness without rediscovering the whole topology. Always use this skill when choosing between ongoing integration coverage and record-replay characterization, even if the user does not name the workflow directly.
---

# Generate Backend Tests

Use this skill when the user wants backend tests around a real boundary, whether fully local or hybrid cloud/local. Start by inspecting the repository and routing the work into the right path instead of committing immediately to one test style.

## Outcome

Produce or update:

- a shared local or hybrid harness for the selected boundary, using reachable configured cloud services when appropriate and Testcontainers for containerized dependencies
- either integration tests, record-replay tests, or both layered on the same harness
- path-specific helpers such as shared setup files, fixture builders, stubs, cassette helpers, and `record` / `verify` entrypoints when needed
- a concise Markdown report that doubles as a re-entry snapshot for future prompts whenever the harness, topology, or scenario inventory would otherwise need to be rediscovered
- explicit rerun commands and a short note explaining the chosen boundary, dependencies, and scenario scope

## Routing workflow

1. Inspect the codebase first: current tests, startup path, runtime boundary, fixture layout, any existing live-test harness, and any existing backend-test report that can act as a re-entry snapshot.
2. If the prompt is additive or the repository already has a shared harness for the same boundary and path, read `references/incremental-extension.md` before broadening the investigation.
3. Read `references/scenario-selection.md`. In incremental mode, use scenario-selection only to identify coverage gaps relative to the existing report — not to restart a broad discovery pass. Propose 2 to 4 gap-filling scenarios drawn from the current report and the user prompt rather than a fresh 3-to-6 menu.
4. Summarize a short list of scenario classes worth testing based on the user prompt, the repository, and any obvious coverage gaps left by existing suites.
5. Ask the user to choose the path only when the prompt and any existing harness do not already make it clear:
   - `integration`
   - `record-replay`
   - `both`
6. Ask the user which proposed scenarios to include only when the prompt does not already pin them down.
7. Read the shared references that apply to any chosen path:
   - `references/shared-harness.md`
   - `references/shared-vitest-lifecycle.md` when Vitest is relevant
8. Read only the references for the chosen path:
   - integration: `references/integration-workflow.md`
   - record-replay: `references/record-replay-workflow.md` and `references/cassette-layout.md`
9. Read optional references only when their trigger is present:
   - `references/cloud-services-harness.md` when a `.env.test` file exists at the repository root, the current package/app directory, or a parent directory up to the repository root. This enables a hybrid topology where pre-deployed cloud services are used when reachable and local containers serve as fallback. If no `.env.test` file exists in those locations, skip this entirely — do not mention it or ask the user about it.
   - `references/promoting-unit-tests.md` when the starting point is a dense mock-heavy unit suite
   - `references/azure-harness.md` when the target depends on Azure-local services or emulators, or when the target is an Azure Functions app
   - `references/azure-functions-harness.md` when the target is an Azure Functions app; read it after `references/azure-harness.md`
   - `references/azure-functions-integration.md` for integration work on Azure Functions; read it after `references/azure-functions-harness.md`
   - `references/azure-functions-record-replay.md` for record-replay work on Azure Functions; read it after `references/azure-functions-harness.md`
10. After implementing the selected path, read `references/final-reporting.md` and decide whether to add or update a concise Markdown report. Default to yes when the user asked for documentation, when the resulting topology, shared harness, or scenario coverage would be hard to reconstruct from the tests alone, or when future incremental additions are likely.

## Path selection rules

- Do not assume a giant test matrix. A short explicit scenario list is better.
- If the prompt strongly points to one path, recommend it, but still let the user pick unless the prompt already selected a path or the work is clearly extending an existing one.
- When a `.env.test` file exists and cloud services are reachable, prefer those over local emulators or Testcontainers for the matching dependencies.
- Follow the cross-cutting rules in `references/shared-harness.md` for Testcontainers policy, harness reuse, and both-paths coexistence.

## Integration path

Choose integration when the user wants ongoing contract coverage across runtime, adapters, persistence, or outbound boundaries.

## Record-replay path

Choose record-replay when the user wants to freeze current observable behavior, create characterization or approval coverage, or add `record` / `verify` workflows that survive refactors.

## Both paths together

When the user chooses both, follow the coexistence rules in `references/shared-harness.md`. Explain clearly which scenarios belong to integration, record-replay, or both.

## Incremental extension mode

When the user asks to add, extend, or widen coverage on top of a harness that already exists, treat that as a distinct workflow instead of starting from zero.

- Use the existing report and harness entrypoints as the first re-entry surface.
- Read the smallest useful set first: report, test scripts, harness entrypoints, and one representative suite for the current path.
- Reuse the existing boundary, path, and topology unless the prompt asks to change them or new evidence makes the current shape dishonest.
- If the repository lacks a concise report and the harness spans multiple files or scenarios, create or update one in the same pass so later prompts can start there.
- Only reopen broad repository discovery when the re-entry artifacts leave a decision genuinely unclear.

## Guardrails

- Keep the selected boundary honest.
- Prefer configured reachable cloud services when `.env.test` is present; otherwise prefer real local hosts, real dependencies, and deterministic local stubs over mocks.
- Keep assertions at observable contract level.
- For record-replay verification, treat the stored cassette as the contract oracle. Do not add extra semantic assertions beyond comparing normalized live layers to stored artifacts.
- If a scenario needs durable semantic assertions, route it to `integration` or `both`.
- Keep record-replay harnesses source-level black-box (full rules in `references/record-replay-workflow.md`).
- If record-replay cannot boot honestly, stop and report the path blocked or ask to switch workflows.
- Do not relitigate stable harness decisions on additive passes.
- Explain any fallback plainly instead of silently downgrading the workflow.

## Final response

When you finish, briefly state:

- which path the user chose
- which scenarios were covered
- which files were added or changed
- which local dependencies or stubs the harness uses
- how the shared harness is structured
- whether a report was added or updated, and where
- how to rerun the tests or workflows

## Examples

**Example 1**
Input: "I want backend tests for this Fastify service, but I'm not sure whether I need integration tests or a freeze-before-refactor workflow."
Output shape: "Inspect the repo, propose a short scenario list, ask the user to choose `integration`, `record-replay`, or `both`, then read only the relevant references before building the harness."

**Example 2**
Input: "Replace these mocked Redis and Postgres tests with live coverage, but keep one path small and honest."
Output shape: "Recommend the integration path, propose the high-value scenarios, boot Redis and Postgres through Testcontainers, and write ongoing integration coverage at the selected boundary."

**Example 3**
Input: "Freeze this Azure Function before I refactor it, and maybe keep one ongoing integration happy path too."
Output shape: "Recommend `both`, build one shared harness for the local Functions host and dependencies, then layer cassettes and `record` / `verify` on top without cloning container startup."

**Example 4**
Input: "Add two more integration scenarios to the worker harness you already set up, and keep the current topology unless there is a real mismatch."
Output shape: "Read the existing report and harness entrypoints first, keep the current integration path, and extend coverage without rediscovering the whole topology."
