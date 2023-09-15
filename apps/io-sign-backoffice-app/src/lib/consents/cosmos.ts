import { getCosmosContainerClient } from "../cosmos";

export async function getTOSAcceptance(
  userId: string,
  institutionId: string
): Promise<boolean> {
  try {
    const cosmos = getCosmosContainerClient("consents");
    const item = await cosmos.item(userId, institutionId).read();
    return item.resource ? true : false;
  } catch (cause) {
    throw new Error("Unable to verify the TOS agreement status", {
      cause,
    });
  }
}

export async function insertTOSAcceptance(
  userId: string,
  institutionId: string
): Promise<void> {
  try {
    const cosmos = getCosmosContainerClient("consents");
    await cosmos.items.create({ id: userId, institutionId });
  } catch (cause) {
    throw new Error("Unable to persist the TOS agreement status", {
      cause,
    });
  }
}
