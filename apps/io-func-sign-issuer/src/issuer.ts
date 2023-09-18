import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as O from "fp-ts/lib/Option";

import { pipe } from "fp-ts/lib/function";

import { Issuer } from "@io-sign/io-sign/issuer";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Id } from "@io-sign/io-sign/id";

export type IssuerRepository = {
  getByVatNumber: (
    vatNumber: Issuer["vatNumber"]
  ) => TE.TaskEither<Error, O.Option<Issuer>>;
  getBySubscriptionId: (
    subscriptionId: Issuer["subscriptionId"]
  ) => TE.TaskEither<Error, O.Option<Issuer>>;
};

type IssuerEnvironment = {
  issuerRepository: IssuerRepository;
};

const getIssuerByField =
  <F extends "subscriptionId" | "vatNumber">(field: F) =>
  (
    p: F extends "subscriptionId"
      ? Issuer["subscriptionId"]
      : Issuer["vatNumber"]
  ): RTE.ReaderTaskEither<IssuerEnvironment, Error, Issuer> =>
  ({ issuerRepository: repo }) =>
    pipe(
      field === "subscriptionId"
        ? repo.getBySubscriptionId(p)
        : repo.getByVatNumber(p),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("The specified issuer was not found")
        )
      )
    );

export const getIssuerByVatNumber = getIssuerByField("vatNumber");

export const ApiKey = t.type({
  id: NonEmptyString,
  institutionId: Id,
  displayName: NonEmptyString,
  environment: t.union([t.literal("test"), t.literal("prod")]),
  cidrs: t.array(t.string),
  testers: t.array(t.string),
  status: t.union([t.literal("active"), t.literal("revoked")]),
  createdAt: NonEmptyString,
  institution: t.type({
    id: NonEmptyString,
    name: NonEmptyString,
    taxCode: NonEmptyString,
  }),
  issuer: t.type({
    id: NonEmptyString,
    externalId: NonEmptyString,
    type: NonEmptyString,
    institutionId: NonEmptyString,
    supportEmail: EmailString,
  }),
});

export type ApiKey = t.TypeOf<typeof ApiKey>;

export const getIssuerBySubscriptionId =
  (
    subscriptionId: Issuer["subscriptionId"]
  ): RTE.ReaderTaskEither<IssuerEnvironment, Error, Issuer> =>
  ({ issuerRepository: repo }) =>
    pipe(
      subscriptionId,
      repo.getBySubscriptionId.bind(repo),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("The specified issuer was not found")
        )
      )
    );

export const getIssuerEnvironment = (
  environment: ApiKey["environment"],
  institutionId: ApiKey["institutionId"]
): Issuer["environment"] =>
  environment === "test"
    ? "TEST"
    : institutionId === "4a4149af-172e-4950-9cc8-63ccc9a6d865"
    ? "INTERNAL"
    : "DEFAULT";

// LEGACY TYPES
// This block can be removed when the entire app has been ported to handler-kit@1
export type GetIssuerByVatNumber = (
  vatNumber: Issuer["vatNumber"]
) => TE.TaskEither<Error, O.Option<Issuer>>;
export type GetIssuerBySubscriptionId = (
  subscriptionId: Issuer["subscriptionId"]
) => TE.TaskEither<Error, O.Option<Issuer>>;
// END
