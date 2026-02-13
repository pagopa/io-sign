import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";

declare const APP_VERSION: string;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const infoHandler = H.of((_: H.HttpRequest) =>
  pipe(
    RTE.right({ message: "It's working!", version: APP_VERSION }),
    RTE.map(H.successJson)
  )
);
