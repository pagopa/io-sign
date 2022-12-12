import * as t from "io-ts";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { Id } from "./id";

export const Issuer = t.type({
  id: Id,
  subscriptionId: NonEmptyString,
  email: t.string,
  address: t.string,
  description: t.string,
  taxCode: t.string,
  vatNumber: t.string,
});

export type Issuer = t.TypeOf<typeof Issuer>;
