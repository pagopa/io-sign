import { getQueueClient } from "@/lib/storage-queue";
import { getInstitution } from "@/lib/institutions/use-cases";
import { getIssuerByInstitution } from "@/lib/issuers/use-cases";

import assert from "node:assert";

import { ApiKey } from "./index";

export async function enqueueApiKey({
  id,
  institutionId,
  environment,
}: ApiKey) {
  try {
    const institution = await getInstitution(institutionId);
    assert(institution, "institution not found");
    const issuer = await getIssuerByInstitution(institution);
    assert(issuer, "issuer not found");
    await getQueueClient("api-keys").sendMessage(
      JSON.stringify({ id, environment, institution, issuer })
    );
  } catch (cause) {
    throw new Error("unable to enqueue message", {
      cause,
    });
  }
}
