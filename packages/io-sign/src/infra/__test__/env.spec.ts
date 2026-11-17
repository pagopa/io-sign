import { describe, expect, it } from "vitest";
import * as E from "fp-ts/lib/Either";
import { readBooleanFromEnvironment } from "../env";

describe("readBooleanFromEnvironment", () => {
  it.each([
    ["true", true],
    ["false", false]
  ])("decodes %s", (value, expected) => {
    expect(
      readBooleanFromEnvironment("USE_MANAGED_IDENTITY")({
        USE_MANAGED_IDENTITY: value
      })
    ).toEqual(E.right(expected));
  });

  it("rejects a missing setting", () => {
    expect(readBooleanFromEnvironment("USE_MANAGED_IDENTITY")({})).toEqual(
      E.left(
        new Error('unable to find "USE_MANAGED_IDENTITY" in node environment')
      )
    );
  });

  it.each(["", "TRUE", "False", "1", "0", " true", "false "])(
    "rejects %j",
    (value) => {
      expect(
        readBooleanFromEnvironment("USE_MANAGED_IDENTITY")({
          USE_MANAGED_IDENTITY: value
        })
      ).toEqual(
        E.left(new Error('"USE_MANAGED_IDENTITY" must be "true" or "false"'))
      );
    }
  );
});
