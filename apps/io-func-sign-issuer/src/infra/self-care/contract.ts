import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";

export const ContractState = t.union([
  t.literal("ACTIVE"),
  t.literal("DELETED"),
]);
export type ContractState = t.TypeOf<typeof ContractState>;

const Institution = t.type({
  address: NonEmptyString,
  description: NonEmptyString,
  digitalAddress: EmailString,
  taxCode: NonEmptyString,
});

const BaseContract = t.type({
  id: NonEmptyString,
  internalIstitutionID: NonEmptyString,
  state: ContractState,
  institution: Institution,
});
type BaseContract = t.TypeOf<typeof BaseContract>;

export const GenericContract = t.intersection([
  BaseContract,
  t.type({
    product: NonEmptyString,
  }),
]);
export type GenericContract = t.TypeOf<typeof GenericContract>;

export const IoSignContract = t.intersection([
  BaseContract,
  t.type({
    product: t.literal("prod-io-sign"),
  }),
]);
export type IoSignContract = t.TypeOf<typeof IoSignContract>;

export const GenericContracts = t.array(GenericContract);
export type GenericContracts = t.TypeOf<typeof GenericContracts>;

export const validateActiveContract = (
  contract: GenericContract
): E.Either<Error, GenericContract> =>
  pipe(
    contract.state === "ACTIVE"
      ? E.right(contract)
      : E.left(new Error("This contract is not active"))
  );
