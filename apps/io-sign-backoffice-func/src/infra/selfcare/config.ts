import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SelfCareEventHubConnectionString: z.string(),
    SELFCARE_API_BASE_PATH: z.string(),
    SELFCARE_API_KEY: z.string(),
    SELFCARE_EVENT_HUB_CONTRACTS_NAME: z.string(),
  })
  .transform((e) => ({
    eventHub: {
      connectionString: e.SelfCareEventHubConnectionString,
      contractsName: e.SELFCARE_EVENT_HUB_CONTRACTS_NAME,
    },
    api: { basePath: e.SELFCARE_API_BASE_PATH, key: e.SELFCARE_API_KEY },
  }));

export type SelfcareConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSelfcareConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing selfcare config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};
