import * as H from "@pagopa/handler-kit";

import { pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/lib/Record";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { apiKeySchema } from "@io-sign/io-sign/api-key";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { IoTsType } from "./validation";
import { getApiKeyById, toApiKeyAccessControl } from "@/api-key";

export const getApiKeyAccessControlHandler = H.of((req: H.HttpRequest) =>
  pipe(
    req.path,
    lookup("id"),
    RTE.fromOption(() => new Error(`Missing "id" in path.`)),
    RTE.flatMapEither(
      H.parse(IoTsType(apiKeySchema.shape.id), `Invalid "id" supplied.`)
    ),
    RTE.flatMap(getApiKeyById),
    RTE.map(toApiKeyAccessControl),
    RTE.map(H.successJson),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
