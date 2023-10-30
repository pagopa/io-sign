import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { pipe } from "fp-ts/lib/function";
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

export const getBackOfficeConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  BackOfficeConfig
> = pipe(
  sequenceS(RE.Apply)({
    apiBasePath: pipe(
      readFromEnvironment("BACK_OFFICE_API_BASE_PATH"),
      RE.orElse(() =>
        RE.right("https://api.io.pagopa.it/api/v1/sign/backoffice")
      )
    ),
    apiKey: readFromEnvironment("BACK_OFFICE_API_KEY"),
  })
);
