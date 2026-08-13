import * as H from "@pagopa/handler-kit";
import { lookup } from "fp-ts/lib/Record";

import { pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const requireName = (
  req: H.HttpRequest
): E.Either<Error, NonEmptyString> =>
  pipe(
    req.headers,
    lookup("x-iosign-name"),
    E.fromOption(
      () => new H.HttpBadRequestError("Missing x-iosign-name in header")
    ),
    E.chainW(H.parse(NonEmptyString, "Invalid name"))
  );

export const requireFamilyName = (
  req: H.HttpRequest
): E.Either<Error, NonEmptyString> =>
  pipe(
    req.headers,
    lookup("x-iosign-family-name"),
    E.fromOption(
      () => new H.HttpBadRequestError("Missing x-iosign-family-name in header")
    ),
    E.chainW(H.parse(NonEmptyString, "Invalid family name"))
  );
