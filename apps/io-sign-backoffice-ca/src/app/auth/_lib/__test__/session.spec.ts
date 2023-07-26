import { vi, it, expect, describe, beforeEach, afterEach } from "vitest";

import { cookies } from "next/headers";

import {
  createSessionCookie,
  destroySessionCookie,
  getPayloadFromSessionCookie,
} from "../session";

vi.stubEnv("AUTH_SESSION_SECRET", "_TEST_");

vi.setSystemTime(1689629834);

const { setCookie, getCookie } = vi.hoisted(() => ({
  setCookie: vi.fn(),
  getCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ set: setCookie, get: getCookie })),
}));

type TestContext = {
  payload: {
    quote: string;
  };
};

beforeEach<TestContext>((ctx) => {
  ctx.payload = {
    quote: "Quality is not an act, it is a habit.",
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createSessionCookie", () => {
  it<TestContext>("creates a session cookie with the given (signed) payload", async (ctx) => {
    await createSessionCookie(ctx.payload);
    expect(setCookie.mock.lastCall[1]).toMatchInlineSnapshot(
      '"eyJhbGciOiJIUzI1NiJ9.eyJxdW90ZSI6IlF1YWxpdHkgaXMgbm90IGFuIGFjdCwgaXQgaXMgYSBoYWJpdC4iLCJpYXQiOjE2ODk2MjksImV4cCI6MTY5MDUyOTgzNH0.Z8iwAN5NJ4R3D-y38RU4sXGhl8UaiMSY6EpU4DOzk0Y"'
    );
  });
});

describe("destroySessionCookie", () => {
  it("replaces the session cookie value with an empty string", () => {
    destroySessionCookie();
    expect(cookies().set).toBeCalledWith(
      "_iosign_session",
      "",
      expect.objectContaining({
        maxAge: 0,
      })
    );
  });
});

describe("getPayloadFromSessionCookie", () => {
  it("throws an exception if the cookie is not found", async () => {
    await expect(() => getPayloadFromSessionCookie()).rejects.toThrowError(
      /unable to get the session cookie/
    );
  });
  it<TestContext>("returns the decoded payload", async (ctx) => {
    await createSessionCookie(ctx.payload);
    getCookie.mockImplementationOnce(() => ({
      value: setCookie.mock.lastCall[1],
    }));
    await expect(getPayloadFromSessionCookie()).resolves.toEqual(
      expect.objectContaining(ctx.payload)
    );
  });
  it<TestContext>("throws an exception if the payload can't be verified", async (ctx) => {
    await createSessionCookie(ctx.payload);
    getCookie.mockImplementationOnce(() => ({
      value: "invalid token, that cannot be verified",
    }));
    await expect(getPayloadFromSessionCookie()).rejects.toThrowError(
      /unable to get/
    );
  });
});
