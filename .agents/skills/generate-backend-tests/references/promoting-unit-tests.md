# Promoting unit tests into integration tests

Use this reference when the repository already has many unit tests around the feature and the user wants a smaller number of live integration tests.

## The mindset shift

Do not translate every unit test into an integration test.

Unit tests are cheap because they isolate behavior. Integration tests are expensive because they prove real seams. The right move is usually to collapse many unit cases into a few scenarios that exercise the real contract end to end at the chosen boundary.

## What to extract from existing unit tests

Mine the unit suite for:

- request or event shapes worth preserving
- seed data and identifiers that make scenarios realistic
- domain invariants that should still hold with real dependencies
- error classes or branch names that point to meaningful integration scenarios
- side effects that matter to callers or downstream systems

## What not to copy

Usually leave these behind:

- mock call counts
- assertions on helper or mapper internals
- fake clients that exist only to keep a unit test alive
- tiny branches that add little value once the real boundary is exercised

## A simple classification pass

For each nearby unit test, classify its main assertion:

| Unit-test assertion | Keep as integration? | Better integration assertion |
| --- | --- | --- |
| "client method called once" | No | Read back the persisted state or observe the outbound stub request |
| "handler returns 200 when use case mock resolves" | Usually rewrite | Call the real host or real handler slice and assert on response plus side effects |
| "repository sends the right SQL or SDK input" | Rewrite | Use the real dependency and read back rows, docs, blobs, or messages |
| "input validation rejects malformed payload" | Sometimes | Keep one or two boundary-level cases if callers really observe them |
| "pure domain branch returns enum X" | Often stay unit-only | Keep it unit-level unless real adapters or runtime behavior are involved |

## Common migrations

### Mocked Redis adapter tests

From:

- mocked Redis client
- assertions on `setEx`, `get`, or `xadd`

To:

- real Redis in Testcontainers
- disposable key namespace per test
- read back value, TTL, stream entry, or pub-sub payload

### Handler tests with mocked use case

From:

- synthetic `HttpRequest`
- mocked use case or service
- assertions on mapping only

To:

- real local HTTP host or real Functions host when that boundary is credible
- or a smaller slice with the real use case plus real adapters if the runtime would be noise
- assert on status, body, headers, and side effects

### Use case tests with mocked partner client

From:

- mocked client adapter
- call-count or argument assertions

To:

- deterministic local HTTP stub server
- real client adapter talking to that stub
- assert on stub-observed request and the system's result

## A good promotion workflow

1. Read the nearby unit tests and cluster them by contract, not by file.
2. Pick the few scenarios that would most worry you in production.
3. Decide which boundary proves those scenarios honestly.
4. Replace mocked dependencies with real local ones or deterministic local stubs.
5. Keep only assertions that stay meaningful when the real system runs.
6. Leave pure logic or combinatorial edge cases in the unit suite when they do not need integration cost.

## Good end state

A healthy result often looks like:

- 1 or 2 runtime-level happy-path tests
- a few narrower integration slices for dense variation
- the old unit suite still covering pure logic cheaply

That combination is much stronger than either "unit tests only" or "rewrite everything as slow host-level tests."
