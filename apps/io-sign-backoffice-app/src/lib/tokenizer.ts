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

export const getTokenizerConfig = cache(() => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing tokenizer config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});
