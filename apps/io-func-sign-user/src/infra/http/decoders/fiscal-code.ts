import { header, HttpRequest } from "handler-kit-legacy/lib/http";

import { validate } from "@io-sign/io-sign/validation";

import { pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import { HttpBadRequestError } from "@io-sign/io-sign/infra/http/errors";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

export const requireFiscalCode = (req: HttpRequest) =>
  pipe(
    req,
    /* This header name (not in `kebab-case`) comes from the specification of messages with attachments that we must respect.
     * https://github.com/pagopa/io-backend/blob/c7257c946b99830fe8c052d4cc0d4dc78b000d51/openapi/consumed/api-third-party.yaml#L94
     */
    header("fiscal_code"),
    E.fromOption(
      () => new HttpBadRequestError("Missing fiscal_code in header"),
    ),
    E.chainW(validate(FiscalCode, "Invalid fiscal code")),
  );
