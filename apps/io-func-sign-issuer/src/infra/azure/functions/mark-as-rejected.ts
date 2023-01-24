import { Database } from "@azure/cosmos";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import { identity, flow } from "fp-ts/lib/function";

import { SignatureRequestRejected } from "@io-sign/io-sign/signature-request";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { makeMarkRequestAsRejected } from "../../../app/use-cases/mark-request-rejected";

const makeRequestAsRejectedHandler = (db: Database) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestRejected),
    TE.fromEither
  );

  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);

  const markAsRejected = makeMarkRequestAsRejected(
    getSignatureRequest,
    upsertSignatureRequest
  );

  return createHandler(
    getSignatureRequestFromQueue,
    markAsRejected,
    identity,
    () => undefined
  );
};

export const makeRequestAsRejectedFunction = flow(
  makeRequestAsRejectedHandler,
  azure.unsafeRun
);
