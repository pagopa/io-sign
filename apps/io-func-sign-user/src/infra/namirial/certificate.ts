import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import * as t from "io-ts";

export const Certificate = t.type({
  status: NonEmptyString,
  serial_number: NonEmptyString,
  subject: NonEmptyString,
  issuer: NonEmptyString,
  valid_from: IsoDateFromString,
  valid_to: IsoDateFromString,
  data: NonEmptyString,
});

export type Certificate = t.TypeOf<typeof Certificate>;
