import { describe, it, expect } from "vitest";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { stringFromBase64Encode, stringToBase64Encode } from "../utility";

describe("Utility", () => {
  describe("stringToBase64Encode", () => {
    it("should convert a string to base64", () => {
      expect(
        pipe(
          "hello world",
          stringToBase64Encode,
          E.fold(() => "invalid", identity)
        )
      ).toBe("aGVsbG8gd29ybGQ=");
    });
    it("should not convert an invalid string", () => {
      expect(pipe(undefined, stringToBase64Encode, E.isLeft)).toBe(true);
    });
  });

  describe("stringFromBase64Encode", () => {
    it("should convert a base64 encoded string to utf-8", () => {
      expect(
        pipe(
          "aGVsbG8gd29ybGQ=",
          stringFromBase64Encode,
          E.fold(() => "invalid", identity)
        )
      ).toBe("hello world");
    });
    it("should not convert an invalid base64 string", () => {
      expect(pipe(undefined, stringFromBase64Encode, E.isLeft)).toBe(true);
    });
  });
});
