import { ulid } from "ulid";

import { Institution } from "@/lib/institutions";

import { CreateIssuerPayload, issuerSchema } from "./index";
import { insertIssuer, getIssuer, replaceSupportEmail } from "./cosmos";
import { sendMessage } from "@/lib/slack";

export async function createIssuerIfNotExists(payload: CreateIssuerPayload) {
  try {
    const issuer = await getIssuer(payload);
    if (issuer) {
      return;
    }
    const newIssuer = issuerSchema.parse({
      externalId: ulid(),
      type: "PA",
      status: "active",
      ...payload,
    });
    await insertIssuer(newIssuer);
    await sendMessage(
      `(_backoffice_) *${payload.name}* (\`${newIssuer.externalId}\`) ha effettuato il primo accesso al portale 🥇`
    );
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
