import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";
import * as TE from "fp-ts/TaskEither";

import { validate } from "@io-sign/io-sign/validation";

import * as t from "io-ts";
import { RetrievedIssuer } from "../cosmos/issuer";

export const run = (_: unknown, items: unknown) =>
  pipe(
    items,
    validate(t.array(RetrievedIssuer)),
    E.map(
      A.map((issuer) => ({
        id: issuer.vatNumber,
        issuerId: issuer.id,
        subscriptionId: issuer.subscriptionId
      }))
    ),
    TE.fromEither,
    TE.toUnion
  )();
