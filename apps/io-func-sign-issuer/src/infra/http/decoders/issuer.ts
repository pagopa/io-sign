import { HttpRequest, header } from "handler-kit-legacy/lib/http";

import * as H from "@pagopa/handler-kit";
import { lookup } from "fp-ts/lib/Record";

import { validate } from "@io-sign/io-sign/validation";

import { flow, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { Issuer } from "@io-sign/io-sign/issuer";
import { HttpUnauthorizedError } from "@io-sign/io-sign/infra/http/errors";
import {
  GetIssuerBySubscriptionId,
  getIssuerBySubscriptionId
} from "../../../issuer";

// ------- DECODERS FOR HANDLER-KIT LEGACY ----------- //
// this block can be removed when the entire app has been upgrated to handler-kit@1
const requireSubscriptionId_legacy = (req: HttpRequest) =>
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
    requireSubscriptionId_legacy,
    TE.fromEither,
    TE.chain(getIssuerBySubscriptionId),
    TE.chainW(TE.fromOption(() => new HttpUnauthorizedError()))
  );
// ------ END BLOCK -------

const requireSubscriptionId = (req: H.HttpRequest) =>
  pipe(
    req.headers,
    lookup("x-subscription-id"),
    E.fromOption(
      () => new H.HttpBadRequestError("Missing x-subscription-id in header")
    ),
    E.chainW(
      H.parse(
        Issuer.props.subscriptionId,
        "The content of x-subscription-id is not a valid id"
      )
    )
  );

export const requireIssuer = flow(
  requireSubscriptionId,
  RTE.fromEither,
  RTE.chainW(getIssuerBySubscriptionId),
  RTE.mapLeft((): Error => new H.HttpUnauthorizedError())
);
