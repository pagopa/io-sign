# Scenario selection for generated backend tests

Use this reference before choosing the workflow path or writing any harness code.

## Goal

Turn the user's prompt and the repository into a short list of scenario classes the user can actually choose from.

Do not jump straight from "please add tests" to a broad implementation. Start by offering a compact menu of high-value scenarios.

## Where scenario ideas should come from

Inspect:

- the user's prompt and any explicit contract they mention
- nearby tests, fixtures, payload samples, or OpenAPI examples
- runtime boundaries such as HTTP routes, Functions triggers, workers, or adapters
- regressions, bug references, or side effects the user names directly

## What to propose

Propose 3 to 6 scenario classes, not an exhaustive matrix.

Good scenario classes often look like:

- one meaningful happy path through the real runtime
- one error or validation path that callers genuinely observe
- one side-effect-driven scenario where storage, cache, queue, or broker output matters
- one specific regression branch the user is worried about
- one smaller slice for dense variation when the full runtime would mostly repeat framework setup

## Keep the list decision-friendly

For each proposed scenario, tell the user:

- the scenario name
- the boundary it would exercise
- whether it fits `integration`, `record-replay`, or `both`
- why it is worth paying test cost for

Keep that explanation short enough that the user can choose quickly.

## Recommended response shape

Use a compact structure such as:

1. likely path recommendation
2. 3 to 6 scenario options
3. a direct ask for:
   - `integration`, `record-replay`, or `both`
   - which scenarios to include

## Do not over-scope

- Do not assume that every nearby unit test becomes a new scenario.
- Do not assume all happy paths and all errors belong in the same suite.
- Do not force both paths when one is clearly enough.
- Do not propose scenarios whose only value is preserving mock-shaped assertions.

## When the prompt already narrows the work

If the prompt already names a specific regression or endpoint, keep that as the anchor scenario and add only a few adjacent options if they materially help the user decide.

If the prompt already implies one path strongly, recommend that path first, but still let the user choose.

## When the user chooses `both`

Identify:

- which scenarios should live only in integration
- which scenarios should live only in record-replay
- which small set, if any, deserves both

Usually that means:

- integration owns the ongoing happy path and durable contract checks
- record-replay owns the freeze-before-refactor scenarios or black-box characterization set

Keep the overlap small and intentional.

## When one scenario is blocked but the harness is still useful

Sometimes the most interesting candidate for `record-replay` or `both` turns out to depend on one local boundary that cannot be exercised honestly, even though most of the topology is still usable.

- Do not force the blocked scenario through a dishonest fallback just to preserve the original idea.
- First check whether a nearby scenario can reuse the same harness while avoiding only the blocked dependency.
- Prefer an adjacent scenario that still protects the same runtime shape, request flow, or persistence side effects over abandoning the whole path.
- State the swap plainly so the user can see which scenario stayed in integration only and which one became the record-replay candidate.
