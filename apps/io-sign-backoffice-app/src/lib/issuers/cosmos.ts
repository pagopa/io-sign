import { Issuer, issuerSchema } from "@/lib/issuers";
import { getCosmosContainerClient } from "../cosmos";

export async function insertIssuer(issuer: Issuer) {
  try {
    const cosmos = getCosmosContainerClient("issuers");
    await cosmos.items.create(issuer);
    return issuer;
  } catch (cause) {
    throw new Error("Error inserting issuer on DB", {
      cause,
    });
  }
}

export async function getIssuer({
  id,
  institutionId,
}: Pick<Issuer, "id" | "institutionId">) {
  try {
    const cosmos = getCosmosContainerClient("issuers");
    const item = await cosmos.item(id, institutionId).read();
    return issuerSchema.parse(item.resource);
  } catch (cause) {
    throw new Error("Error getting issuer on DB", {
      cause,
    });
  }
}
