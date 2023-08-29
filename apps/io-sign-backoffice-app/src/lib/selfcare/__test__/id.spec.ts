import { describe, vi, it, expect } from "vitest";

import * as SelfCareIdentity from "../id";

const { jwtVerify, createRemoteJWKSet } = vi.hoisted(() => ({
  jwtVerify: vi.fn(
    async (): Promise<{}> => ({
      payload: {
        uid: "42f7d28a-ccca-487d-8777-040b07b7e622",
        name: "Mario",
        family_name: "Rossi",
        email: "mario.rossi+test@pagopa.it",
        organization: {
          id: "42f7d28a-ccca-487d-8777-040b07b7e622",
        },
        iat: Date.now(),
        desired_exp: Date.now() + 15 * 60 * 1000,
      },
    })
  ),
  createRemoteJWKSet: vi.fn(() => "test-jwkset"),
}));

vi.mock("jose", () => ({
  jwtVerify,
  createRemoteJWKSet,
}));

vi.stubEnv(
  "AUTH_SELFCARE_JWK_SET_URL",
  "https://selfcare.pagopa.it/.well-known/jwks.json"
);

vi.stubEnv("AUTH_SELFCARE_JWT_ISSUER", "test-issuer");
vi.stubEnv("AUTH_SELFCARE_JWT_AUDIENCE", "test-audience");

describe("verify", () => {
  it("verifies the id token using the right config", async () => {
    await SelfCareIdentity.verify("myidtok");
    expect(createRemoteJWKSet).toHaveBeenCalledWith(
      expect.objectContaining({
        href: process.env.AUTH_SELFCARE_JWK_SET_URL,
      })
    );
    expect(jwtVerify).toHaveBeenCalledWith("myidtok", "test-jwkset", {
      issuer: "test-issuer",
      audience: "test-audience",
    });
  });
  it("throws an error if the id token does not contain the expected payload", async () => {
    jwtVerify.mockImplementationOnce(async () => ({
      payload: {},
    }));
    await expect(() =>
      SelfCareIdentity.verify("invalid-id-token")
    ).rejects.toThrowError();
  });
});
