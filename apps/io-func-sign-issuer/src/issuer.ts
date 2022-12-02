import * as t from "io-ts";

import { Id, newId } from "@io-sign/io-sign/id";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

export const Issuer = t.type({
  id: Id,
  subscriptionId: t.string,
});

export type Issuer = t.TypeOf<typeof Issuer>;

export const newIssuer = (subscriptionId: string): Issuer => ({
  id: newId(),
  subscriptionId,
});

export type GetIssuerBySubscriptionId = (
  subscriptionId: Issuer["subscriptionId"]
) => TE.TaskEither<Error, O.Option<Issuer>>;

export const issuerNotFoundError = new EntityNotFoundError("Issuer");
