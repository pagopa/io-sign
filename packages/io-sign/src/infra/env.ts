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

export const readNonEmptyFromEnvironment = (variableName: string) =>
  pipe(
    readFromEnvironment(variableName),
    RE.chainEitherK((value) =>
      pipe(
        NonEmptyString.decode(value),
        E.mapLeft(
          () => new Error(`"${variableName}" must be a non-empty string`)
        )
      )
    )
  );
