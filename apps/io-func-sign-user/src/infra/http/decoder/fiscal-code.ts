import { header, HttpRequest } from "@pagopa/handler-kit/lib/http";

import { validate } from "@io-sign/io-sign/validation";

import { pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import { HttpBadRequestError } from "@io-sign/io-sign/infra/http/errors";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

export const requireFiscalCode = (req: HttpRequest) =>
  pipe(
    req,
    header("fiscal_code"),
    E.fromOption(
      () => new HttpBadRequestError("Missing fiscal_code in header")
    ),
    E.chainW(validate(FiscalCode, "Invalid fiscal code"))
  );
