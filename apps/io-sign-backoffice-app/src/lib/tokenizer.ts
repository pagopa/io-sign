import { z } from "zod";
import { cache } from "react";

const Config = z
  .object({
    PDV_TOKENIZER_API_BASE_PATH: z.string().nonempty(),
    PDV_TOKENIZER_API_KEY: z.string().nonempty(),
  })
  .transform((env) => ({
    pdvTokenizerApiBasePath: env.PDV_TOKENIZER_API_BASE_PATH,
    pdvTokenizerApiKey: env.PDV_TOKENIZER_API_KEY,
  }));

const getTokenizerConfig = cache(() => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing tokenizer config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});

export async function getToken(pii: string): Promise<string> {
  const { pdvTokenizerApiBasePath, pdvTokenizerApiKey } = getTokenizerConfig();
  const res = await fetch(
    `${pdvTokenizerApiBasePath}/tokenizer/v1/tokens/search`,
    {
      headers: {
        "x-api-key": pdvTokenizerApiKey,
        Accept: "application/json, text/plain",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        pii,
      }),
    }
  );
  if (!res.ok) {
    throw new Error("error getting token on tokenizer");
  }

  const body = await res.json();
  const parsedBody = z
    .object({
      token: z.string().uuid(),
    })
    .parse(body);
  return parsedBody.token;
}
