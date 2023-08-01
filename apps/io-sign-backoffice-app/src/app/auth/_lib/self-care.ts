import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import { cache } from "react";

const Config = z
  .object({
    AUTH_SELFCARE_JWK_SET_URL: z.string().url(),
    AUTH_SELFCARE_JWT_ISSUER: z.string().nonempty(),
    AUTH_SELFCARE_JWT_AUDIENCE: z.string().nonempty(),
  })
  .transform((e) => ({
    jwks: new URL(e.AUTH_SELFCARE_JWK_SET_URL),
    audience: e.AUTH_SELFCARE_JWT_AUDIENCE,
    issuer: e.AUTH_SELFCARE_JWT_ISSUER,
  }));

const getConfig = cache(() => {
  const result = Config.safeParse(process.env);
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
  email: z.string().email(),
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

export async function verifySelfCareIdToken(idToken: string): Promise<Claims> {
  try {
    const config = getConfig();
    const jwks = createRemoteJWKSet(config.jwks);
    const result = await jwtVerify(idToken, jwks, {
      issuer: config.issuer,
      audience: config.audience,
    });
    return Claims.parse(result.payload);
  } catch (e) {
    throw new Error("the provided id token is not valid", {
      cause: e,
    });
  }
}
