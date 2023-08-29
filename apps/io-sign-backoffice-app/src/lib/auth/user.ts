import { z } from "zod";
import * as SelfCareIdentity from "@/lib/selfcare/id";
import { getPayloadFromSessionCookie, createSessionCookie } from "./session";

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});

export type User = z.infer<typeof User>;

export class UnauthenticatedUserError extends Error {
  constructor(e: unknown) {
    super("unauthenticated user", {
      cause: e,
    });
    this.name = "UnauthenticatedUserError";
  }
}

export let authenticate = async (idToken: string) => {
  const {
    iat,
    desired_exp,
    uid: id,
    email,
    name: firstName,
    family_name: lastName,
    organization: { id: institutionId },
  } = await SelfCareIdentity.verify(idToken);
  const user = {
    id,
    email,
    firstName,
    lastName,
  };
  const maxAge = (desired_exp - iat) / 1000;
  await createSessionCookie(user, maxAge);
  return { user, institutionId };
};

if (process.env.NODE_ENV === "development") {
  authenticate = async () => {
    const user = {
      id: "0f6143c2-250a-410f-9da7-8040599ad4d3",
      firstName: "Napoleone",
      lastName: "Bonaparte",
      email: "n.bonaparte@email.test.it",
    };
    await createSessionCookie(user, Date.now() + 2592000);
    return { user, institutionId: "8c68a47b-fdbd-46e9-91df-71aa0d45043b" };
  };
}

export const getLoggedUser = async () => {
  try {
    const payload = await getPayloadFromSessionCookie();
    return User.parse(payload);
  } catch (e) {
    throw new UnauthenticatedUserError(e);
  }
};
