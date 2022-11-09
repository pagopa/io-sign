import * as E from "fp-ts/lib/Either";
import { identity, pipe } from "fp-ts/lib/function";

import { getConfigFromEnvironment } from "./config";

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const config = configOrError;
