import { ApiManagementClient } from "@azure/arm-apimanagement";
import { Config } from "@/app/config";
import { SubscriptionCreationError } from "@/error";

export async function createApimSubscription(
  resourceId: string,
  displayName: string,
  apimClient: ApiManagementClient,
  config: Config
) {
  const { subscriptionId, resourceGroupName, serviceName, productName } =
    config.azure.apim;
  return apimClient.subscription
    .createOrUpdate(resourceGroupName, serviceName, resourceId, {
      displayName,
      scope: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.ApiManagement/service/${serviceName}/products/${productName}`,
    })
    .then((x) => {
      const primaryKey = x.primaryKey;
      if (!primaryKey) {
        throw new SubscriptionCreationError("There has been an error");
      }
      return primaryKey;
    })
    .catch(() => {
      throw new SubscriptionCreationError("There has been an error");
    });
}
