import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import { readFromEnvironment } from "@io-sign/io-sign/infra/env";

import { flow, pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";

export const MockConfig = t.type({
  spidAssertionMock: NonEmptyString,
});

export type MockConfig = t.TypeOf<typeof MockConfig>;

export const getMockConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  MockConfig
> = sequenceS(RE.Apply)({
  spidAssertionMock: pipe(
    readFromEnvironment("SpidAssertionMock"),
    RE.chainEitherK(
      flow(
        NonEmptyString.decode,
        E.mapLeft(
          (e) => new Error(`Invalid SPID assertion mock! ${readableReport(e)}`)
        )
      )
    )
  ),
});
