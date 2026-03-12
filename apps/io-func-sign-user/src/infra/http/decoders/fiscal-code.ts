import * as H from "@pagopa/handler-kit";
import { lookup } from "fp-ts/lib/Record";

import { pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

export const requireFiscalCode = (
  req: H.HttpRequest
): E.Either<Error, FiscalCode> =>
  pipe(
    req.headers,
    lookup("fiscal_code"),
    E.fromOption(
      () => new H.HttpBadRequestError("Missing fiscal_code in header")
    ),
    E.chainW(H.parse(FiscalCode, "Invalid fiscal code"))
  );
