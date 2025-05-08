import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SelfCareEventHubConnectionString: z.string(),
    SELFCARE_EVENT_HUB_CONTRACTS_NAME: z.string()
  })
  .transform((e) => ({
    eventHubContractsName: e.SELFCARE_EVENT_HUB_CONTRACTS_NAME
  }));

export type SelfcareConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSelfcareConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing selfcare config", {
      cause: result.error.issues
    });
  }
  return result.data;
};
