import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { Issuer } from "@io-sign/io-sign/issuer";

export type GetIssuerBySubscriptionId = (
  subscriptionId: Issuer["subscriptionId"]
) => TE.TaskEither<Error, O.Option<Issuer>>;

export const issuerNotFoundError = new EntityNotFoundError("Issuer");
