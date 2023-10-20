import { z } from "zod";
import { cache } from "react";

const Config = z
  .object({
    SLACK_WEB_HOOK_URL: z.string().url(),
  })
  .transform((env) => ({
    webhook: env.SLACK_WEB_HOOK_URL,
  }));

const getSlackConfig = cache(() => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing slack config", {
      cause: result.error.cause,
    });
  }
  return result.data;
});

export async function sendSlackMessage(text: string) {
  try {
    const config = getSlackConfig();
    await fetch(config.webhook, {
      method: "POST",
      body: JSON.stringify({
        text,
      }),
    });
  } catch (cause) {
    // fail silently
  }
}
