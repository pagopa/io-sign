import { header, HttpRequest } from "@pagopa/handler-kit/lib/http";

import { validate } from "@internal/io-sign/validation";

import { pipe, flow } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import {
  Issuer,
  GetIssuerBySubscriptionId,
  issuerNotFoundError,
} from "../../../issuer";

const requireSubscriptionId = (req: HttpRequest) =>
  pipe(
    req,
    header("x-subscription-id"),
    E.fromOption(() => new Error("Missing X-Subscription-Id header")),
    E.chainW(validate(Issuer.props.subscriptionId, "Invalid subscription id"))
  );

export const makeRequireIssuer = (
  getIssuerBySubscriptionId: GetIssuerBySubscriptionId
) =>
  flow(
    requireSubscriptionId,
    TE.fromEither,
    TE.chain(getIssuerBySubscriptionId),
    TE.chain(TE.fromOption(() => issuerNotFoundError))
  );
