import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/function";

// TODO(SFEQS-1676): write an RTE abstraction to check the health of backing services
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const InfoHandler = H.of((_: H.HttpRequest) =>
  pipe(RTE.right({ message: "it works!" }), RTE.map(H.successJson))
);
