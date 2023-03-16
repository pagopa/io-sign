import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { SelfCareConfig } from "./config";
import { GenericContract } from "./contract";

export const SelfCareInstitution = t.type({
  description: NonEmptyString,
  supportEmail: EmailString,
});

export type SelfCareInstitution = t.TypeOf<typeof SelfCareInstitution>;

export type GetInstitutionById = (
  internalInstitutionId: GenericContract["internalIstitutionID"]
) => TE.TaskEither<Error, SelfCareInstitution>;

const isSuccessful = (r: Response): boolean =>
  r.status >= 200 && r.status < 300;

const defaultHeader = {
  "Content-Type": "application/json",
};
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
                "Ocp-Apim-Subscription-Key": api.apiKey,
              },
            }
          ),
        E.toError
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to get institution from self-care failed.")
      ),
      TE.chain((response) => TE.tryCatch(() => response.json(), E.toError)),
      TE.chainEitherKW(
        flow(
          SelfCareInstitution.decode,
          E.mapLeft(
            (errs) =>
              new Error(
                `Invalid format for self-care institution: ${readableReport(
                  errs
                )}`
              )
          )
        )
      )
    );
