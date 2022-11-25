import { header, HttpRequest } from "@pagopa/handler-kit/lib/http";

import { validate } from "@internal/io-sign/validation";

import { pipe, flow } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import { Signer } from "@internal/io-sign/signer";

const requireSignerId = (req: HttpRequest) =>
  pipe(
    req,
    header("x-iosign-signer-id"),
    E.fromOption(() => new Error("Missing signer_id in header")),
    E.chainW(validate(Signer.props.id, "Invalid signer id"))
  );

export const makeRequireSigner = flow(
  requireSignerId,
  E.map((signerId) => ({ id: signerId } as Signer))
);
