import { SubscriptionCreationError } from "@/error";
import { getApimClient } from "./client";
import { getApimConfig } from "./config";

export async function createApimSubscription(
  resourceId: string,
  displayName: string
) {
  const { subscriptionId, resourceGroupName, serviceName, productName } =
    getApimConfig();
  const apimClient = getApimClient();
  return apimClient.subscription
    .createOrUpdate(resourceGroupName, serviceName, resourceId, {
      displayName,
      scope: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.ApiManagement/service/${serviceName}/products/${productName}`,
    })
    .then((x) => {
      const primaryKey = x.primaryKey;
      if (!primaryKey) {
        throw new SubscriptionCreationError("Unable to create the API key");
      }
      return primaryKey;
    })
    .catch(() => {
      throw new SubscriptionCreationError("Unable to create the API key");
    });
}
