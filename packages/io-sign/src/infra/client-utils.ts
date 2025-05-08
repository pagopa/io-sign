import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export const isSuccessful = (r: Response): boolean =>
  r.status >= 200 && r.status < 300;

export const defaultHeader = {
  "Content-Type": "application/json"
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
            (errs) => new Error(`${message}\n [${readableReport(errs)}]`)
          )
        )
      )
    );
