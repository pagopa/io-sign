import { createPdvTokenizerClient } from "@internal/pdv-tokenizer/client";
import { getConfigOrThrow } from "../../app/config";

const config = getConfigOrThrow();

export const pdvTokenizerClientWithApiKey = createPdvTokenizerClient(
  config.pagopa.tokenizer.basePath,
  config.pagopa.tokenizer.apiKey
);
