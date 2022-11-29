import { flow, identity } from "fp-ts/lib/function";
import { describe, it, expect } from "@jest/globals";
import { ActionNotAllowedError } from "../../../error";
import { ValidationError } from "../../../validation";
import { HttpError } from "../errors";
import { ProblemDetail, toProblemDetail } from "../problem-detail";

describe("problem-detail", () => {
  describe("toProblemDetail", () => {
    it("should parse a ValidationError as ValidationProblemDetail", () => {
      const e = new ValidationError([]);
      const problem = toProblemDetail(e);
      expect(ProblemDetail.types[1].is(problem)).toBe(true);
    });
    it("should parse other errors as HttpProblemDetail", () => {
      const errors = [
        new HttpError(),
        new ActionNotAllowedError(),
        new Error("I'm a teapot!"),
      ];
      const result = errors
        .map(flow(toProblemDetail, ProblemDetail.types[0].is))
        .every(identity);
      expect(result).toBe(true);
    });
  });
});
