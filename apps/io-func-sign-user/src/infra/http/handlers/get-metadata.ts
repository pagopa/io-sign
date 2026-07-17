import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { requireFiscalCode } from "../decoders/fiscal-code";

type GetMetadataDependencies = {
  ioSignServiceId: string;
};

export const GetMetadataHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(requireFiscalCode(req)),
    RTE.chainW(() =>
      pipe(
        RTE.ask<GetMetadataDependencies>(),
        RTE.map(({ ioSignServiceId }) =>
          H.successJson({ serviceId: ioSignServiceId })
        )
      )
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
