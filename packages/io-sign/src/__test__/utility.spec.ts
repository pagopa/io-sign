import { describe, it, expect } from "vitest";

import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import {
  stringFromBase64Encode,
  stringToBase64Encode,
  truncateWithEllipsis
} from "../utility";

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

  describe("truncateWithEllipsis", () => {
    const truncateTo10Chars = truncateWithEllipsis(10);

    it("should leave a string shorter than the limit unchanged", () => {
      expect(truncateTo10Chars("hello")).toBe("hello");
    });

    it("should leave a string exactly at the limit unchanged", () => {
      expect(truncateTo10Chars("1234567890")).toBe("1234567890");
    });

    it("should truncate a string exceeding the limit and append ellipsis", () => {
      expect(truncateTo10Chars("12345678901")).toBe("1234567...");
    });

    it("should truncate to 121 characters (default) including ellipsis", () => {
      const truncateTo121Chars = truncateWithEllipsis();
      const long = "Hai un documento da firmare - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec feugiat dapibus nisi gravida semper. Aenean ultrices semper eros non blandit. Pellentesque tincidunt varius metus. Ut pharetra neque ut augue vehicula lobortis. Ut sit amet eros leo. Phasellus quis elit vitae risus posuere sollicitudin eget sed metus.";
      const result = truncateTo121Chars(long);
      expect(result.length).toBe(121);
      expect(result.endsWith("...")).toBe(true);
    });
  });
});
