# Incremental extension of an existing backend-test harness

Use this reference when the user asks to add more tests, extend coverage, or continue work on a harness that already exists in the repository.

## Goal

Preserve context by starting from the smallest stable artifact set instead of rediscovering the full topology on every pass.

## Default re-entry order

Read sources in this order and stop broadening the read set as soon as the next decision becomes clear:

1. an existing backend-test report or coverage report
2. package or runner scripts that show how the suite is invoked
3. the shared harness entrypoints such as `global-setup`, `harness`, `support/`, or `record` / `verify` helpers
4. one representative suite that already uses the harness for the same path
5. only the nearby fixtures, helpers, and application files needed for the new scenarios

If those artifacts already explain the boundary, dependency topology, and current scenario inventory, do not reopen a repository-wide discovery pass.

## What to treat as the source of truth

- The existing harness and report define the current path unless the prompt asks to change it.
- The current scenario table defines what is already covered and where the natural gaps are.
- The rerun commands and setup files define how the harness is meant to be exercised.

## Snapshot choice

Default to a concise Markdown report as the persistent snapshot because it is cheap to reread, easy for humans to maintain, and already useful to contributors.

Only introduce a separate machine-readable manifest when:

- the repository already has a stable pattern for machine-readable test metadata, or
- the user explicitly asks for a machine-readable snapshot

Do not invent extra persisted state just because it is possible.

## Scenario proposal in incremental mode

Even incremental prompts often require proposing new scenarios (e.g., "increase coverage", "add edge cases"). The difference from a first run is the source and scope, not the absence of proposals:

- Draw scenario ideas from the existing report's gap list, the current harness boundary, and the user prompt — not from a fresh repository-wide discovery.
- Propose 2 to 4 gap-filling scenarios unless the prompt already names them explicitly.
- If `references/scenario-selection.md` is also read in this pass, treat it as methodology guidance (how to phrase proposals, what makes a scenario worth paying for) rather than as a signal to restart broad inspection.

## User interaction rules

- If the prompt already says `integration`, `record-replay`, or `both`, keep that selection unless the existing harness makes it impossible or dishonest.
- If the prompt already names the new scenarios, do not reopen scenario selection.
- If the prompt is additive but vague (e.g., "widen coverage", "add more edge cases"), propose 2 to 4 gap-filling scenarios based on the current report and boundary instead of a fresh broad menu.

## When to revisit the topology

Revisit path or harness design only when one of these is true:

- the user asks to switch workflows
- the new scenario crosses a boundary the current harness does not honestly cover
- a dependency strategy that was previously acceptable is now blocking the requested scenario
- the existing report or harness is too ambiguous to trust

If none of those is true, extend the existing harness rather than redesigning it.

## What to update after the change

When the incremental pass lands, update the report so the next pass can start there:

- new scenarios and their file locations
- any new helpers or setup files
- any changed rerun commands
- intentional gaps that remain

## Avoid

- rereading the whole repository when the current harness already explains the shape
- reopening path selection on every additive prompt
- cloning the harness into a parallel setup just for new scenarios
- writing long historical summaries when a compact report plus file paths is enough
