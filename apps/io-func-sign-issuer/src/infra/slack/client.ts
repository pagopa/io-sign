import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { SlackConfig } from "./config";

const isSuccessful = (r: Response): boolean =>
  r.status >= 200 && r.status < 300;

const defaultHeader = {
  "Content-Type": "application/json",
};

const PostMessageResponse = t.type({
  ok: t.literal(true),
  ts: t.string,
});

type PostMessageResponse = t.TypeOf<typeof PostMessageResponse>;

export const makePostSlackMessage =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (config: SlackConfig) =>
  (channel: string) =>
  (message: string) =>
    pipe(
      TE.tryCatch(
        () =>
          fetchWithTimeout(
            `${config.apiBasePath}/api/chat.postMessage?channel=${channel}&text=${message}`,
            {
              method: "GET",
              headers: {
                ...defaultHeader,
                Authorization: `Bearer ${config.apiToken}`,
              },
            }
          ),
        E.toError
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to post message on slack channel failed.")
      ),
      TE.chain((response) => TE.tryCatch(() => response.json(), E.toError)),
      TE.chainEitherKW(
        flow(
          PostMessageResponse.decode,
          E.mapLeft(
            (errs) =>
              new Error(
                `Invalid format for slack response: ${readableReport(errs)}`
              )
          )
        )
      )
    );
