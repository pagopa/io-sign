import * as t from "io-ts";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { Id } from "./id";

export const IssuerEnvironment = t.union([
  t.literal("TEST"),
  t.literal("DEFAULT"),
  t.literal("INTERNAL"),
]);
export type IssuerEnvironment = t.TypeOf<typeof IssuerEnvironment>;

export const IssuerStatus = t.union([
  t.literal("ACTIVE"),
  t.literal("INACTIVE"),
]);
export type IssuerStatus = t.TypeOf<typeof IssuerStatus>;

export const Issuer = t.type({
  id: Id,
  subscriptionId: NonEmptyString,
  email: EmailString,
  description: NonEmptyString,
  internalInstitutionId: Id,
  // The need is to know if an issuer is in the experimental phase or not
  environment: IssuerEnvironment,
  vatNumber: NonEmptyString,
  department: t.string,
  status: IssuerStatus,
});

export type Issuer = t.TypeOf<typeof Issuer>;
