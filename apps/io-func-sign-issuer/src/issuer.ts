import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as O from "fp-ts/lib/Option";

import { pipe } from "fp-ts/lib/function";

import { Issuer } from "@io-sign/io-sign/issuer";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

type SearchField = "subscriptionId" | "vatNumber";

type Payload<F extends SearchField> = F extends "subscriptionId"
  ? Issuer["subscriptionId"]
  : Issuer["vatNumber"];

type IssuerRepository = {
  getBy: <F extends SearchField>(
    field: F,
    p: Payload<F>
  ) => TE.TaskEither<Error, O.Option<Issuer>>;
};

type IssuerEnvironment = {
  issuerRepository: IssuerRepository;
};

const getIssuerByField =
  <F extends SearchField>(field: F) =>
  (p: Payload<F>): RTE.ReaderTaskEither<IssuerEnvironment, Error, Issuer> =>
  ({ issuerRepository: repo }) =>
    pipe(
      repo.getBy(field, p),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("The specified issuer was not found")
        )
      )
    );

export const getIssuerBySubscriptionId = getIssuerByField("subscriptionId");
export const getIssuerByVatNumber = getIssuerByField("vatNumber");

// LEGACY TYPES
// This block can be removed when the entire app has been ported to handler-kit@1
export type GetIssuerByVatNumber = (
  vatNumber: Issuer["vatNumber"]
) => TE.TaskEither<Error, O.Option<Issuer>>;
export type GetIssuerBySubscriptionId = (
  subscriptionId: Issuer["subscriptionId"]
) => TE.TaskEither<Error, O.Option<Issuer>>;
// END
