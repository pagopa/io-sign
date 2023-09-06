import { ulid } from "ulid";
import { z } from "zod";

import { issuerSchema } from "./index";
import { insertIssuer } from "./cosmos";

export const createIssuerPayloadSchema = issuerSchema.pick({
  institutionId: true,
  supportEmail: true,
});

export type CreateIssuerPayload = z.infer<typeof createIssuerPayloadSchema>;

export async function createIssuer(payload: CreateIssuerPayload) {
  return insertIssuer({
    id: ulid(),
    type: "PA",
    ...payload,
  });
}

export { getIssuer } from "./cosmos";
