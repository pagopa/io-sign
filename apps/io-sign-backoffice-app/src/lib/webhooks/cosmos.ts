import { getCosmosContainerClient } from "../cosmos";
import { z } from "zod";

import { Webhook, webhookSchema } from "./index";

const cosmosContainerName = "webhooks";

export async function insertWebhook(webhook: Webhook): Promise<void> {
  try {
    await getCosmosContainerClient(cosmosContainerName).items.create(webhook);
  } catch (cause) {
    throw new Error("unable to create the webhook", { cause });
  }
}

export async function updateWebhook(
  webhook: Webhook,
  fields: Partial<Pick<Webhook, "url" | "status" | "publicKeyThumbprint">>
): Promise<void> {
  try {
    const operations = Object.entries(fields).map(([key, value]) => ({
      op: "replace" as const,
      path: `/${key}`,
      value,
    }));
    await getCosmosContainerClient(cosmosContainerName)
      .item(webhook.id, webhook.issuerId)
      .patch(operations);
  } catch (cause) {
    throw new Error("unable to update the webhook", { cause });
  }
}

export async function deleteWebhook(webhook: Webhook): Promise<void> {
  try {
    await getCosmosContainerClient(cosmosContainerName)
      .item(webhook.id, webhook.issuerId)
      .delete();
  } catch (cause) {
    throw new Error("unable to delete the webhook", { cause });
  }
}

export async function getWebhook(
  id: string,
  issuerId: string
): Promise<Webhook | undefined> {
  try {
    const item = await getCosmosContainerClient(cosmosContainerName)
      .item(id, issuerId)
      .read();

    return webhookSchema.or(z.undefined()).parse(item.resource);
  } catch (cause) {
    throw new Error("unable to get the webhook", { cause });
  }
}