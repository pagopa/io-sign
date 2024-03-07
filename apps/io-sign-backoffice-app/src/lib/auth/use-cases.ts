import { InstitutionDetail } from "../institutions";
import {
  getInstitution,
  getInstitutionsByUserId,
} from "@/lib/institutions/use-cases";
import { createIssuerIfNotExists } from "@/lib/issuers/use-cases";
import { userSchema } from "./index";
import { verify } from "./selfcare";
import { getPayloadFromSessionCookie, createSessionCookie } from "./session";
import { User } from "@/lib/auth";

export class UnauthenticatedUserError extends Error {
  constructor(e: unknown) {
    super("unauthenticated user", {
      cause: e,
    });
    this.name = "UnauthenticatedUserError";
  }
}

export let authenticate = async (idToken: string) => {
  try {
    const {
      iat,
      desired_exp,
      uid: id,
      name: firstName,
      family_name: lastName,
      organization: { id: institutionId },
    } = await verify(idToken);
    const institution = await getInstitution(institutionId);
    if (!institution) {
      throw new Error(`Institution ${institutionId} does not exists`);
    }
    await createIssuerIfNotExists({
      id: institution.taxCode,
      institutionId,
      supportEmail: institution.supportEmail,
      name: institution.name,
    });
    const user = {
      id,
      firstName,
      lastName,
    };
    const maxAge = desired_exp - iat;
    await createSessionCookie(user, maxAge);
    return { user, institutionId };
  } catch (cause) {
    throw new Error("Can't authenticate user", { cause });
  }
};

if (process.env.NODE_ENV === "development") {
  authenticate = async () => {
    const user = {
      id: "0f6143c2-250a-410f-9da7-8040599ad4d3",
      firstName: "Napoleone",
      lastName: "Bonaparte",
      email: "n.bonaparte@email.test.it",
    };
    const institution: InstitutionDetail = {
      id: "8c68a47b-fdbd-46e9-91df-71aa0d45043b",
      name: "Comune di Genola",
      taxCode: "0010213",
      supportEmail: "firmaconio-tech@pagopa.it",
      vatNumber: "0010213",
    };
    await createIssuerIfNotExists({
      id: institution.taxCode,
      institutionId: institution.id,
      supportEmail: institution.supportEmail,
      name: institution.name,
    });
    await createSessionCookie(user, Date.now() + 2592000);
    return { user, institutionId: institution.id };
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

export async function isAllowedInstitution(
  userId: User["id"],
  institutionId: string
) {
  const institutions = await getInstitutionsByUserId(userId);
  return institutions.some((institution) => institution.id === institutionId);
}
