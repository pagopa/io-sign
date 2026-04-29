import { flow, pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/Record";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

import * as H from "@pagopa/handler-kit";

import { Signer } from "@io-sign/io-sign/signer";

export const SpidLevel = t.keyof({
  "https://www.spid.gov.it/SpidL1": null,
  "https://www.spid.gov.it/SpidL2": null,
  "https://www.spid.gov.it/SpidL3": null
});
export type SpidLevel = t.TypeOf<typeof SpidLevel>;

export const requireSpidLevel = (req: H.HttpRequest) =>
  pipe(
    req.headers,
    lookup("x-iosign-spid-level"),
    E.fromOption(
      () =>
        new H.HttpForbiddenError(
          "Missing x-iosign-spid-level header"
        )
    ),
    E.chainW(
      H.parse(
        SpidLevel,
        "The content of x-iosign-spid-level is not a valid SPID level"
      )
    ),
    E.chainW((spidLevel) =>
      spidLevel === "https://www.spid.gov.it/SpidL3"
        ? E.right(spidLevel)
        : E.left(
            new H.HttpForbiddenError(
              "A minimum SPID level of L3 is required to create a signature"
            )
          )
    )
  );

export const requireSignerId = (req: H.HttpRequest) =>
  pipe(
    req.headers,
    lookup("x-iosign-signer-id"),
    E.fromOption(
      () => new H.HttpBadRequestError("Missing x-iosign-signer-id in header")
    ),
    E.chainW(
      H.parse(
        Signer.props.id,
        "The content of x-iosign-signer-id is not a valid id"
      )
    )
  );

export const requireSigner = flow(
  requireSignerId,
  E.map((id) => ({ id })),
  E.chainW(H.parse(Signer, "Cannot parse the given object to a Signer"))
);
