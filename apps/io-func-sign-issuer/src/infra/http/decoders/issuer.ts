import * as H from "@pagopa/handler-kit";
import { lookup } from "fp-ts/lib/Record";

import { flow, pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { Issuer } from "@io-sign/io-sign/issuer";
import { getIssuerBySubscriptionId } from "../../../issuer";

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
