import { z } from "zod";

export const ApimConfig = z.object({
  subscriptionId: z.string(),
  resourceGroupName: z.string(),
  serviceName: z.string(),
  productName: z.string(),
});

export type ApimConfig = z.infer<typeof ApimConfig>;

export const getApimConfigFromEnvironment = (): ApimConfig =>
  z
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
    }))
    .parse(process.env);
