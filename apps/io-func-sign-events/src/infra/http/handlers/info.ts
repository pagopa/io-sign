import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/function";

import * as H from "@pagopa/handler-kit";

declare const APP_VERSION: string;

export const InfoHandler = H.of((_: H.HttpRequest) =>
  pipe(
    RTE.right({ message: "It's working!", version: APP_VERSION }),
    RTE.map(H.successJson)
  )
);
