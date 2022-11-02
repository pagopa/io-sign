import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { ulid } from "ulid";

export const Id = NonEmptyString;
export type Id = NonEmptyString;

export const id = (): Id => ulid() as Id;
