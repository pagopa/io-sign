import * as t from "io-ts";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { Id } from "./id";

export const Issuer = t.type({
  id: Id,
  subscriptionId: NonEmptyString,
  email: EmailString,
  address: t.string,
  description: NonEmptyString,
  taxCode: t.string,
  vatNumber: t.string,
});

export type Issuer = t.TypeOf<typeof Issuer>;
