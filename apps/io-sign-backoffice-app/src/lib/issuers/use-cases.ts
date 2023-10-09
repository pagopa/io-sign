import { ulid } from "ulid";

import { Institution } from "@/lib/institutions";

import { CreateIssuerPayload } from "./index";
import { insertIssuer, getIssuer, replaceSupportEmail } from "./cosmos";

export async function createIssuerIfNotExists(payload: CreateIssuerPayload) {
  try {
    const issuer = await getIssuer(payload);
    if (issuer) {
      return;
    }
    await insertIssuer({
      externalId: ulid(),
      type: "PA",
      state: "active",
      ...payload,
    });
  } catch (cause) {
    throw new Error("Error creating issuer", { cause });
  }
}

export function getIssuerByInstitution({
  id: institutionId,
  taxCode,
}: Pick<Institution, "id" | "taxCode">) {
  return getIssuer({ id: taxCode, institutionId });
}

export { replaceSupportEmail };
