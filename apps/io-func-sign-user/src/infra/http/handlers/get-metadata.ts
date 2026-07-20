import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { requireFiscalCode } from "../decoders/fiscal-code";

type GetMetadataDependencies = {
  ioSignServiceId: NonEmptyString;
};

export const GetMetadataHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(requireFiscalCode(req)),
    RTE.chainW(
      () =>
        ({ ioSignServiceId }: GetMetadataDependencies) =>
          TE.right(H.successJson({ serviceId: ioSignServiceId }))
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
