import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    BACK_OFFICE_API_BASE_PATH: z.string(),
    BACK_OFFICE_API_KEY: z.string(),
  })
  .transform((e) => ({
    apiBasePath: e.BACK_OFFICE_API_BASE_PATH,
    apiKey: e.BACK_OFFICE_API_KEY,
  }));

export type BackOfficeConfig = z.infer<typeof ConfigFromEnvironment>;

export const getBackOfficeConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing back office config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};
