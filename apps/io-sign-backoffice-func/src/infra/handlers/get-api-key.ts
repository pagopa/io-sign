import * as H from "@pagopa/handler-kit";

import { pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/lib/Record";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { ApiKey, apiKeySchema } from "@io-sign/io-sign/api-key";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { IoTsType } from "./validation";
import { getApiKeyById } from "@/api-key";
import { getInstitutionById, getIssuerByInstitution } from "@/institution";

export const getApiKey = (id: ApiKey["id"]) =>
  pipe(
    getApiKeyById(id),
    RTE.flatMap((apiKey) =>
      pipe(
        getInstitutionById(apiKey.institutionId),
        RTE.flatMap((institution) =>
          pipe(
            getIssuerByInstitution(institution),
            RTE.map((issuer) => ({ issuer, institution, ...apiKey }))
          )
        )
      )
    )
  );

export const getApiKeyHandler = H.of((req: H.HttpRequest) =>
  pipe(
    req.path,
    lookup("id"),
    RTE.fromOption(() => new Error(`Missing "id" in path.`)),
    RTE.flatMapEither(
      H.parse(IoTsType(apiKeySchema.shape.id), `Invalid "id" supplied.`)
    ),
    RTE.flatMap(getApiKey),
    RTE.map(H.successJson),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
