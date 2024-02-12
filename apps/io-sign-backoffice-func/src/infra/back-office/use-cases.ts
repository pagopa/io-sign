import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";

import { BackofficeApiClient, Issuer } from "./client";

export type BackofficeEnvironment = {
  backofficeApiClient: BackofficeApiClient;
};

export const issuerAlreadyExists =
  (k: Pick<Issuer, "id" | "institutionId">) => (r: BackofficeEnvironment) =>
    pipe(r.backofficeApiClient.getIssuer(k), TE.map(O.isSome));

export const getContactsByInstitutionId =
  (institutionId: Issuer["institutionId"]) => (r: BackofficeEnvironment) =>
    r.backofficeApiClient.getUsers(institutionId);
