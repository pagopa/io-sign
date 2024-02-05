import { pipe, flow } from "fp-ts/lib/function";
import { lookup } from "fp-ts/Record";
import * as E from "fp-ts/lib/Either";

import * as H from "@pagopa/handler-kit";

import { Signer } from "@io-sign/io-sign/signer";

export const requireSignerId = (req: H.HttpRequest) =>
  pipe(
    req.headers,
    lookup("x-iosign-signer-id"),
    E.fromOption(
      () => new H.HttpBadRequestError("Missing x-iosign-signer-id in header"),
    ),
    E.chainW(
      H.parse(
        Signer.props.id,
        "The content of x-iosign-signer-id is not a valid id",
      ),
    ),
  );

export const requireSigner = flow(
  requireSignerId,
  E.map((id) => ({ id })),
  E.chainW(H.parse(Signer, "Cannot parse the given object to a Signer")),
);
