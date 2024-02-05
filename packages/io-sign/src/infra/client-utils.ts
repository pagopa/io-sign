import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";

export const isSuccessful = (r: Response): boolean =>
  r.status >= 200 && r.status < 300;

export const defaultHeader = {
  "Content-Type": "application/json",
};

export const responseToJson =
  <T>(schema: t.Decoder<unknown, T>, message: string) =>
  (response: Response) =>
    pipe(
      TE.tryCatch(() => response.json(), E.toError),
      TE.chainEitherKW(
        flow(
          schema.decode,
          E.mapLeft(
            (errs) => new Error(`${message}\n [${readableReport(errs)}]`),
          ),
        ),
      ),
    );
