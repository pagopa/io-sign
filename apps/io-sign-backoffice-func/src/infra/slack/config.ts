import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    SLACK_WEBHOOK_URL: z.string()
  })
  .transform((e) => ({
    webhookUrl: e.SLACK_WEBHOOK_URL
  }));

export type SlackConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSlackConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing slack config", {
      cause: result.error.issues
    });
  }
  return result.data;
};
