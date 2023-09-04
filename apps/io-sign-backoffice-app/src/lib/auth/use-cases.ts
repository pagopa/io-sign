import { userSchema } from "./index";
import { verify } from "./selfcare";
import { getPayloadFromSessionCookie, createSessionCookie } from "./session";

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
  } = await verify(idToken);
  const user = {
    id,
    email,
    firstName,
    lastName,
  };
  const maxAge = desired_exp - iat;
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
    return userSchema.parse(payload);
  } catch (e) {
    throw new UnauthenticatedUserError(e);
  }
};
