import { ulid } from "ulid";
import { z } from "zod";

import { Institution } from "@/lib/institutions";

import { issuerSchema } from "./index";
import { insertIssuer, getIssuer } from "./cosmos";

export const createIssuerPayloadSchema = issuerSchema.pick({
  id: true,
  institutionId: true,
  supportEmail: true,
});

export async function createIssuer(payload: CreateIssuerPayload) {
  return insertIssuer({
    externalId: ulid(),
    type: "PA",
    ...payload,
  });
}

export type CreateIssuerPayload = z.infer<typeof createIssuerPayloadSchema>;

export function getIssuerByInstitution({
  id: institutionId,
  taxCode,
}: Pick<Institution, "id" | "taxCode">) {
  return getIssuer({ id: taxCode, institutionId });
}
