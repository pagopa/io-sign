import { describe, it, expect } from "vitest";
import * as t from "io-ts";
import { success, created, error } from "../response";

describe("response", () => {
  describe("success", () => {
    it("should create a response with 200 as status code", () => {
      const res = success(t.string)("Success!");
      expect(res.statusCode).toBe(200);
    });
    it("should serialize the payload as JSON", () => {
      const payloadT = t.type({ message: t.string });
      const payload: t.TypeOf<typeof payloadT> = { message: "It works!" };
      const res = success(payloadT)(payload);
      expect(res.body).toBe(JSON.stringify(payload));
      // eslint-disable-next-line sonarjs/no-duplicate-string
      expect(res.headers).toHaveProperty("Content-Type", "application/json");
    });
    it("should return a serialization error on invalid payload", () => {
      const payload = { message: "It should not parse" };
      const res = success(t.string)(payload);
      expect(res.statusCode).toBe(500);
      expect(res.headers).toHaveProperty(
        "Content-Type",
        "application/problem+json"
      );
    });
  });
  describe("created", () => {
    it("should create a response with 201 as status code", () => {
      const res = created(t.string)("Created");
      expect(res.statusCode).toBe(201);
    });
  });
  describe("error", () => {
    it('should create a response with "application/problem+json" Content-Type', () => {
      const res = error(new Error("Unexpected"));
      expect(res.headers).toHaveProperty(
        "Content-Type",
        "application/problem+json"
      );
    });
  });
});
