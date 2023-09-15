import { vi, it, expect, describe } from "vitest";

import { getLoggedUser, authenticate } from "../use-cases";

const mocks = vi.hoisted(() => ({
  user: {
    id: "53680989-1538-40f4-932d-36a63fa1135d",
    firstName: "Mario",
    lastName: "Rossi",
  },
  organization: {
    id: "53680989-1538-40f4-932d-36a63fa1135d",
  },
}));

const { getPayloadFromSessionCookie, createSessionCookie } = vi.hoisted(() => ({
  getPayloadFromSessionCookie: vi.fn(() => mocks.user),
  createSessionCookie: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getPayloadFromSessionCookie,
  createSessionCookie,
}));

vi.mock("@/lib/auth/selfcare", () => ({
  verify: vi.fn(async () => ({
    uid: mocks.user.id,
    name: mocks.user.firstName,
    family_name: mocks.user.lastName,
    organization: mocks.organization,
    iat: 0,
    desired_exp: 15 * 60,
  })),
}));

vi.mock("@/lib/institutions/use-cases", () => ({
  getInstitution: vi.fn().mockResolvedValue({
    id: "8c68a47b-fdbd-46e9-91df-71aa0d45043b",
    name: "Comune di Genola",
    taxCode: "0010213",
    supportEmail: "firmaconio-tech@pagopa.it",
  }),
}));

vi.mock("@/lib/issuers/use-cases", () => ({
  createIssuerIfNotExists: vi.fn().mockResolvedValue({}),
}));

describe("getLoggedUser", () => {
  it("returns the User object stored in the session cookie", async () => {
    const user = await getLoggedUser();
    expect(user).toEqual(mocks.user);
  });
  it("throws on invalid payload", async () => {
    getPayloadFromSessionCookie.mockImplementationOnce(() => ({
      ...mocks.user,
      email: "unit+test",
    }));
    await expect(() => getLoggedUser()).rejects.toThrowError(/unauthenticated/);
  });
});

describe("authenticate", () => {
  it("creates a session cookie with the right payload", async () => {
    const { institutionId } = await authenticate("my-id-tok");
    expect(institutionId).toBe(mocks.organization.id);
    expect(createSessionCookie).toHaveBeenCalledWith(mocks.user, 15 * 60);
  });
});
