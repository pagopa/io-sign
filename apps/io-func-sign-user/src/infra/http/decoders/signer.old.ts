import { header, HttpRequest } from "handler-kit-legacy/lib/http";

import { validate } from "@io-sign/io-sign/validation";

import { pipe, flow } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import { Signer } from "@io-sign/io-sign/signer";
import { HttpBadRequestError } from "@io-sign/io-sign/infra/http/errors";

const requireSignerId = (req: HttpRequest) =>
  pipe(
    req,
    header("x-iosign-signer-id"),
    E.fromOption(
      () => new HttpBadRequestError("Missing x-iosign-signer-id in header"),
    ),
    E.chainW(validate(Signer.props.id, "Invalid signer id")),
  );

export const requireSigner = flow(
  requireSignerId,
  E.map((id) => ({ id })),
  E.chainW(validate(Signer, "Invalid signer.")),
);
