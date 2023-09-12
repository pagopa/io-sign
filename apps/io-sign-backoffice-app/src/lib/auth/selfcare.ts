import { z } from "zod";
import { cache } from "react";
import * as jose from "jose";

const ConfigFromEnvironment = z
  .object({
    AUTH_SELFCARE_JWK_SET_URL: z.string().url(),
    AUTH_SELFCARE_JWT_ISSUER: z.string().nonempty(),
    AUTH_SELFCARE_JWT_AUDIENCE: z.string().nonempty(),
  })
  .transform((e) => ({
    remoteJWKSetUrl: new URL(e.AUTH_SELFCARE_JWK_SET_URL),
    audience: e.AUTH_SELFCARE_JWT_AUDIENCE,
    issuer: e.AUTH_SELFCARE_JWT_ISSUER,
  }));

const getConfigFromEnvironment = cache(() => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing auth.self-care config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});

const Claims = z.object({
  // issued at (in ms)
  iat: z.number(),
  uid: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().nonempty(),
  family_name: z.string().nonempty(),
  organization: z.object({
    id: z.string().uuid(),
  }),
  // "desired_exp" is a custom claim, issued by self care
  // that has the purpose to "syncronize" session duration
  // between the product backoffice and the self care portal
  desired_exp: z.number(),
});

type Claims = z.infer<typeof Claims>;

export async function verify(jwt: string): Promise<Claims> {
  const config = getConfigFromEnvironment();
  try {
    const jwks = jose.createRemoteJWKSet(config.remoteJWKSetUrl);
    const { payload } = await jose.jwtVerify(jwt, jwks, {
      audience: config.audience,
      issuer: config.issuer,
    });
    return Claims.parse(payload);
  } catch (e) {
    throw new Error("unable to verify the provided id token", {
      cause: e,
    });
  }
}
