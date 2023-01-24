import * as t from "io-ts";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { Id } from "./id";

export const Issuer = t.type({
  id: Id,
  subscriptionId: NonEmptyString,
  email: EmailString,
  description: NonEmptyString,
  // The need is to know if an issuer is in the experimental phase or not
  isTesting: t.boolean,
});

export type Issuer = t.TypeOf<typeof Issuer>;
