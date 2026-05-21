# Final reporting for generated backend tests

Use this reference after implementing the selected test workflow and before you finalize the task.

## Goal

Leave behind a short report that helps the user and future contributors understand what the new test coverage actually protects without reopening every test, harness, or cassette file.

## When to produce a report

Default to adding or updating a Markdown report when at least one of these is true:

- the user explicitly asked for documentation, a report, or a summary artifact
- the work adds or changes multiple scenarios
- the work introduces or changes a shared harness, Testcontainers topology, local stubs, or emulator usage
- integration and record-replay suites now coexist for the same boundary
- the chosen boundary is intentionally narrower than the full runtime and that choice should be documented

You can skip the report when the change is tiny, obvious from one test file, and the user did not ask for documentation.

## Preferred location

Prefer this order:

1. update an existing test-coverage or workflow document if the repository already has one
2. create a focused Markdown report in the repository root when there is no better existing location
3. use a docs folder only when the repository already treats it as the natural home for engineering notes like this

Keep the file name explicit, such as:

- `<app>-test-report.md`
- `<service>-integration-report.md`
- `<component>-coverage-report.md`

## What the report should contain

Keep it concise, but include enough detail that someone can answer "what is covered, through which boundary, on which local dependencies, and how do I rerun it?" without reading the whole suite.

Typical sections:

- scope
- suite overview
- shared infrastructure or harness summary
- scenario table
- rerun commands
- current intentional gaps when they matter

## Scenario table guidance

For each meaningful scenario, prefer columns like:

- scenario name
- file or suite location
- honest boundary exercised
- observable outcome
- infrastructure actually used

This is usually more useful than long prose paragraphs.

## Diagrams

Add Mermaid diagrams only when they genuinely clarify the flow:

- request -> runtime -> dependency -> side effect
- queue trigger -> handler -> output binding
- record -> cassette -> verify loops

Do not add diagrams just because Mermaid is available. A good rule is: if the boundary or side effects are easy to explain in one sentence, skip the diagram.

## What to emphasize

Highlight the facts that are hard to infer quickly from the code:

- which dependencies are real local emulators versus lightweight SDK-only seams
- whether the full runtime host is used or intentionally avoided
- which scenarios are protected by long-lived integration checks versus characterization cassettes
- which helpers or setup files are shared across suites

## Guardrails

- Keep the report factual and tied to the tests that were actually added or changed.
- Do not restate every assertion line by line.
- Do not invent coverage that is not present.
- If you chose a narrower slice instead of the full host, explain why plainly.
- If the user asked for the report, mention its path in the final response.
