import { pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/lib/Record";

import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";

import * as RE from "fp-ts/lib/ReaderEither";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const readFromEnvironment =
  (variableName: string) => (env: NodeJS.ProcessEnv) =>
    pipe(
      env,
      lookup(variableName),
      O.chain(O.fromNullable),
      E.fromOption(
        () => new Error(`unable to find "${variableName}" in node environment`)
      )
    );

export const getIoSignServiceIdFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  NonEmptyString
> = pipe(
  readFromEnvironment("IoSignServiceId"),
  RE.chainEitherK((value) =>
    pipe(
      NonEmptyString.decode(value),
      E.mapLeft(() => new Error(`"IoSignServiceId" must be a non-empty string`))
    )
  )
);
