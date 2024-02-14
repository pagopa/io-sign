import { z } from "zod";
import { cache } from "react";
import { fiscalCodeSchema } from "./api-keys";

const Config = z
  .object({
    PDV_TOKENIZER_API_BASE_PATH: z.string().min(1),
    PDV_TOKENIZER_API_KEY: z.string().min(1),
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

// TODO: change name con qualcosa tipo getSignerIdFromFiscalCode
export async function getTokenFromPii(pii: string): Promise<string> {
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

// TODO: Signer o SignerId? getFiscalCodeBySignerId ?
export async function getPiiFromToken(token: string): Promise<string> {
  const { pdvTokenizerApiBasePath, pdvTokenizerApiKey } = getTokenizerConfig();
  const res = await fetch(
    `${pdvTokenizerApiBasePath}/tokenizer/v1/tokens/${token}/pii`,
    {
      headers: {
        "x-api-key": pdvTokenizerApiKey,
        Accept: "application/json, text/plain",
        "Content-Type": "application/json",
      },
      method: "GET",
    }
  );
  if (!res.ok) {
    throw new Error("error getting pii on tokenizer");
  }

  const body = await res.json();
  const parsedBody = z
    .object({
      pii: fiscalCodeSchema, // z.string().uuid()
    })
    .parse(body);
  return parsedBody.pii;
}

export async function getTokenizerHealth() {
  try {
    const token = "7af2e3e7-4923-4595-b0fe-aba33d8a7325";
    const { pdvTokenizerApiBasePath, pdvTokenizerApiKey } =
      getTokenizerConfig();
    const res = await fetch(
      `${pdvTokenizerApiBasePath}/tokenizer/v1/tokens/${token}/pii`,
      {
        headers: {
          "x-api-key": pdvTokenizerApiKey,
        },
        method: "GET",
      }
    );
    if (!res.ok) {
      throw new Error();
    }
  } catch {
    throw "tokenizer";
  }
}
