import { getCosmosContainerClient } from "../cosmos";
import { FeedResponse } from "@azure/cosmos";

import { Webhook } from "./index";

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
  fields: Partial<Pick<Webhook, "url" | "status">>
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

export async function getWebhook(
  id: string,
  issuerId: string
): Promise<Webhook | undefined> {
  try {
    const query = "SELECT * FROM c WHERE c.id = @id AND c.issuerId = @issuerId";
    const parameters = [
      { name: "@id", value: id },
      { name: "@issuerId", value: issuerId }
    ];
    const cosmosResponse: AsyncIterable<FeedResponse<Webhook>> =
      getCosmosContainerClient(cosmosContainerName)
        .items.query({
          parameters,
          query
        })
        .getAsyncIterator();

    for await (const { resources } of cosmosResponse) {
      const webhook = resources.at(0);
      if (typeof webhook !== "undefined") {
        return webhook;
      }
    }

    return undefined;
  } catch (cause) {
    throw new Error("unable to get the webhook", { cause });
  }
}