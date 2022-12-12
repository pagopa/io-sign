import { header, HttpRequest } from "@pagopa/handler-kit/lib/http";

import { validate } from "@io-sign/io-sign/validation";

import { pipe, flow } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { Issuer } from "@io-sign/io-sign/issuer";
import { GetIssuerBySubscriptionId } from "../../../issuer";

import { HttpUnauthorizedError } from "@io-sign/io-sign/infra/http/errors";

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
    TE.chainW(TE.fromOption(() => new HttpUnauthorizedError()))
  );
