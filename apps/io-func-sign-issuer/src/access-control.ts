import * as H from "@pagopa/handler-kit";

import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe } from "fp-ts/lib/function";

import { Issuer } from "@io-sign/io-sign/issuer";

export const ApiKeyAccessControl = t.type({
  environment: t.union([t.literal("test"), t.literal("prod")]),
  testers: t.array(t.string)
});

export type AccessControlRepository = {
  getApiKeyAccessControl: (
    subscriptionId: Issuer["subscriptionId"]
  ) => TE.TaskEither<Error, ApiKeyAccessControl>;
};

export type ApiKeyAccessControl = t.TypeOf<typeof ApiKeyAccessControl>;

type AccessControlEnvironment = {
  accessControlRepository: AccessControlRepository;
};

const isFiscalCodeAllowed = (
  { environment, testers }: ApiKeyAccessControl,
  fiscalCode: string
): boolean => environment === "prod" || testers.includes(fiscalCode);

const getApiKeyAccessControl =
  (
    subscriptionId: Issuer["subscriptionId"]
  ): RTE.ReaderTaskEither<
    AccessControlEnvironment,
    Error,
    ApiKeyAccessControl
  > =>
  ({ accessControlRepository }) =>
    accessControlRepository.getApiKeyAccessControl(subscriptionId);

export const ensureFiscalCodeAllowed = (
  subscriptionId: Issuer["subscriptionId"],
  fiscalCode: string
): RTE.ReaderTaskEither<AccessControlEnvironment, Error, void> =>
  pipe(
    getApiKeyAccessControl(subscriptionId),
    RTE.filterOrElseW(
      (accessControl) => isFiscalCodeAllowed(accessControl, fiscalCode),
      () =>
        new H.HttpForbiddenError(
          "The fiscal code is not allowed for this issuer."
        )
    ),
    RTE.map(() => undefined)
  );
