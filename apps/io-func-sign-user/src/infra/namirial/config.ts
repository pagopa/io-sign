import * as t from "io-ts";

import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";
import { pipe } from "fp-ts/lib/function";
import { IssuerEnvironment } from "@io-sign/io-sign/issuer";

export const NamirialCredentialsConfig = t.type({
  basePath: t.string,
  username: t.string,
  password: t.string,
});

export type NamirialCredentialsConfig = t.TypeOf<
  typeof NamirialCredentialsConfig
>;

export const NamirialConfig = t.type({
  prod: NamirialCredentialsConfig,
  test: NamirialCredentialsConfig,
  requestTimeoutMs: t.number,
});

export type NamirialConfig = t.TypeOf<typeof NamirialConfig>;

export const getNamirialConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  NamirialConfig
> = pipe(
  sequenceS(RE.Apply)({
    basePath: readFromEnvironment("NamirialApiBasePath"),
    username: readFromEnvironment("NamirialUsername"),
    password: readFromEnvironment("NamirialPassword"),
    testBasePath: readFromEnvironment("NamirialTestApiBasePath"),
    testUsername: readFromEnvironment("NamirialTestUsername"),
    testPassword: readFromEnvironment("NamirialTestPassword"),
    requestTimeoutMs: RE.right(5000),
  }),
  RE.map((config) => ({
    prod: {
      basePath: config.basePath,
      username: config.username,
      password: config.username,
    },
    test: {
      basePath: config.testBasePath,
      username: config.testUsername,
      password: config.testPassword,
    },
    requestTimeoutMs: config.requestTimeoutMs,
  }))
);

export const getNamirialCredentialsFromIssuerEnvironment =
  (issuerEnvironment: IssuerEnvironment) => (config: NamirialConfig) =>
    issuerEnvironment === "DEFAULT" ? config.prod : config.test;
