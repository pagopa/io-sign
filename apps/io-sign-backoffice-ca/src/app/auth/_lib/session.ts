import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { z } from "zod";

const defaultCookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: true,
};

const cookieName = "_iosign_session";

const getSecret = cache(() => {
  const Secret = z.string().nonempty();
  const result = Secret.safeParse(process.env.AUTH_SESSION_SECRET);
  if (!result.success) {
    throw new Error("error parsing the auth session secret from environment", {
      cause: result.error.issues,
    });
  }
  const secret = new TextEncoder().encode(result.data);
  return secret;
});

/**
 * Creats a session cookie (an http-only, secure cookie that contains an encrypted payload)
 * @param payload
 * @param maxAge the number of seconds until the session cookie expires
 */
export async function createSessionCookie(
  payload: {},
  maxAge: number = 15 * 60
) {
  const jwt = new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Date.now() + maxAge * 1000);
  const secret = getSecret();
  const value = await jwt.sign(secret);
  cookies().set(cookieName, value, {
    maxAge,
    ...defaultCookieOptions,
  });
}

export function destroySessionCookie() {
  cookies().set(cookieName, "", {
    maxAge: 0,
    ...defaultCookieOptions,
  });
}

function getSessionCookie(): { name: string; value: string } {
  const cookie = cookies().get(cookieName);
  if (typeof cookie === "undefined") {
    throw new Error("unable to get the session cookie");
  }
  return cookie;
}

export async function getPayloadFromSessionCookie(): Promise<{}> {
  let payload: {};
  try {
    const cookie = getSessionCookie();
    const secret = getSecret();
    const result = await jwtVerify(cookie.value, secret);
    payload = result.payload;
  } catch (e) {
    throw new Error("unable to get the session cookie", {
      cause: e,
    });
  }
  return payload;
}
