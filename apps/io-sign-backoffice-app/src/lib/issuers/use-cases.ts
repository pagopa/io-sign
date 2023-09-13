import { ulid } from "ulid";

import { Institution } from "@/lib/institutions";

import { CreateIssuerPayload } from "./index";
import { insertIssuer, getIssuer, replaceSupportEmail } from "./cosmos";

export async function createIssuer(payload: CreateIssuerPayload) {
  return insertIssuer({
    externalId: ulid(),
    type: "PA",
    ...payload,
  });
}

export function getIssuerByInstitution({
  id: institutionId,
  taxCode,
}: Pick<Institution, "id" | "taxCode">) {
  return getIssuer({ id: taxCode, institutionId });
}

export { replaceSupportEmail };
