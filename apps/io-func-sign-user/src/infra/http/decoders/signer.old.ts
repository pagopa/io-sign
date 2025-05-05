import { HttpBadRequestError } from "@io-sign/io-sign/infra/http/errors";
import { Signer } from "@io-sign/io-sign/signer";
import { validate } from "@io-sign/io-sign/validation";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest, header } from "handler-kit-legacy/lib/http";

const requireSignerId = (req: HttpRequest) =>
  pipe(
    req,
    header("x-iosign-signer-id"),
    E.fromOption(
      () => new HttpBadRequestError("Missing x-iosign-signer-id in header")
    ),
    E.chainW(validate(Signer.props.id, "Invalid signer id"))
  );

export const requireSigner = flow(
  requireSignerId,
  E.map((id) => ({ id })),
  E.chainW(validate(Signer, "Invalid signer."))
);
