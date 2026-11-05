import * as H from "@pagopa/handler-kit";

import { flow } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { getIssuerBySubscriptionId } from "../../../issuer";
import { requireSubscriptionId } from "./subscription-id";

export const requireIssuer = flow(
  requireSubscriptionId,
  RTE.fromEither,
  RTE.chainW(getIssuerBySubscriptionId),
  RTE.mapLeft((): Error => new H.HttpUnauthorizedError())
);
