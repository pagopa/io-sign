import { z } from "zod";
import { getTokenizerConfig } from "../tokenizer";

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
