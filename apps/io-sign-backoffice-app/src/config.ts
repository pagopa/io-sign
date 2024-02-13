import { z } from "zod";
import { cache } from "react";

const ConfigFromEnvironment = z
  .object({
    NEXT_PUBLIC_SELFCARE_URL: z.string().url(),
    SELFCARE_LOGOUT_URL: z.string().url(),
    API_HOST: z.string().min(1),
  })
  .transform((e) => ({
    selfCare: {
      portal: {
        url: e.NEXT_PUBLIC_SELFCARE_URL,
        logoutUrl: e.SELFCARE_LOGOUT_URL,
      },
    },
    apiHost: e.API_HOST,
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
