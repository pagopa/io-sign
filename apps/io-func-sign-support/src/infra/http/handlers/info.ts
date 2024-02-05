import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/function";

import * as H from "@pagopa/handler-kit";

// TODO(SFEQS-1676): write an RTE abstraction to check the health of backing services
export const InfoHandler = H.of((_: H.HttpRequest) =>
  pipe(RTE.right({ message: "it works!" }), RTE.map(H.successJson))
);
