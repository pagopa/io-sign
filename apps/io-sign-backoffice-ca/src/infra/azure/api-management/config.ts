import { z } from "zod";

const Config = z
  .object({
    SUBSCRIPTION_ID: z.string().nonempty(),
    RESOURCE_GROUP_NAME: z.string().nonempty(),
    SERVICE_NAME: z.string().nonempty(),
    PRODUCT_NAME: z.string().nonempty(),
  })
  .transform((env) => ({
    subscriptionId: env.SUBSCRIPTION_ID,
    resourceGroupName: env.RESOURCE_GROUP_NAME,
    serviceName: env.SERVICE_NAME,
    productName: env.PRODUCT_NAME,
  }));

export const getApimConfig = () => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing apim config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};
