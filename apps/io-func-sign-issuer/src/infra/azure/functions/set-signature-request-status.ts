import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RE from "fp-ts/lib/ReaderEither";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";
import { sequenceS } from "fp-ts/lib/Apply";

import { createHandler } from "@pagopa/handler-kit";

import { Database as CosmosDatabase } from "@azure/cosmos";
import { validate } from "@io-sign/io-sign/validation";
import { error } from "@io-sign/io-sign/infra/http/response";
import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { SetSignatureRequestStatusBody } from "../../http/models/SetSignatureRequestStatusBody";
import { makeMarkRequestAsReady } from "../../../app/use-cases/mark-request-ready";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

const makeSetSignatureRequestStatusHandler = (db: CosmosDatabase) => {
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const getSignatureRequest = makeGetSignatureRequest(db);

  const markRequestAsReady = makeMarkRequestAsReady(upsertSignatureRequest);

  const requireSignatureRequest = makeRequireSignatureRequest(
    mockGetIssuerBySubscriptionId,
    getSignatureRequest
  );

  const requireSetSignatureRequestStatusBody: RE.ReaderEither<
    HttpRequest,
    Error,
    "READY"
  > = flow(
    (req) => req.body,
    validate(SetSignatureRequestStatusBody),
    E.filterOrElse(
      (status) => status === "READY",
      () => new Error("only READY is allowed")
    )
  );

  const requireMarkRequestAsReadyPayload = pipe(
    sequenceS(RTE.ApplyPar)({
      signatureRequest: requireSignatureRequest,
      body: RTE.fromReaderEither(requireSetSignatureRequestStatusBody),
    }),
    RTE.map(({ signatureRequest }) => signatureRequest)
  );

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireMarkRequestAsReadyPayload)
  );

  return createHandler(
    decodeHttpRequest,
    markRequestAsReady,
    error,
    () => void 0
  );
};

export const makeSetSignatureRequestStatusFunction = flow(
  makeSetSignatureRequestStatusHandler,
  azure.unsafeRun
);
