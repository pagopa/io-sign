import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import { Issuer } from "@io-sign/io-sign/issuer";

export type GetIssuerByVatNumber = (
  vatNumber: Issuer["vatNumber"]
) => TE.TaskEither<Error, O.Option<Issuer>>;

export type GetIssuerBySubscriptionId = (
  subscriptionId: Issuer["subscriptionId"]
) => TE.TaskEither<Error, O.Option<Issuer>>;

export type GetIssuerById = (
  id: Issuer["id"]
) => TE.TaskEither<Error, O.Option<Issuer>>;

export type GetIssuerByInternalInstitutionId = (
  internalInstitutionId: Issuer["internalInstitutionId"]
) => TE.TaskEither<Error, O.Option<Issuer>>;
