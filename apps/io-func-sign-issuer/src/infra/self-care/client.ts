import {
  defaultHeader,
  isSuccessful,
  responseToJson
} from "@io-sign/io-sign/infra/client-utils";
import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { SelfCareConfig } from "./config";
import { GenericContract } from "./contract";

export const SelfCareInstitution = t.type({
  description: NonEmptyString,
  supportEmail: EmailString
});

export type SelfCareInstitution = t.TypeOf<typeof SelfCareInstitution>;

export type GetInstitutionById = (
  internalInstitutionId: GenericContract["internalIstitutionID"]
) => TE.TaskEither<Error, SelfCareInstitution>;

export const makeGetInstitutionById =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  ({ api }: SelfCareConfig): GetInstitutionById =>
  (internalInstitutionId: GenericContract["internalIstitutionID"]) =>
    pipe(
      TE.tryCatch(
        () =>
          fetchWithTimeout(
            `${api.basePath}/external/v2/institutions/${internalInstitutionId}`,
            {
              method: "GET",
              headers: {
                ...defaultHeader,
                "Ocp-Apim-Subscription-Key": api.apiKey
              }
            }
          ),
        E.toError
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to get institution from self-care failed.")
      ),
      TE.chain(
        responseToJson(
          SelfCareInstitution,
          "Invalid format for self-care institution"
        )
      )
    );
