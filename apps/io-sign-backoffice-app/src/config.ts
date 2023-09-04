import { z } from "zod";
import { cache } from "react";

const ConfigFromEnvironment = z
  .object({
    SELFCARE_URL: z.string().url(),
    SELFCARE_SUPPORT_URL: z.string().url(),
    SELFCARE_LOGOUT_URL: z.string().url(),
    DOCUMENTATION_URL: z.string().url(),
  })
  .transform((e) => ({
    selfCare: {
      portal: {
        url: e.SELFCARE_URL,
        supportUrl: e.SELFCARE_SUPPORT_URL,
        logoutUrl: e.SELFCARE_LOGOUT_URL,
      },
    },
    documentationUrl: e.DOCUMENTATION_URL,
  }));

export type Config = z.infer<typeof ConfigFromEnvironment>;

export const getConfig = cache(() => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error loading the config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});
