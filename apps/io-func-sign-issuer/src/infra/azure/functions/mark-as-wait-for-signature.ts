import { Database } from "@azure/cosmos";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";

import * as TE from "fp-ts/lib/TaskEither";
import { identity, flow } from "fp-ts/lib/function";

import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";
import { makeMarkRequestAsWaitForSignature } from "../../../app/use-cases/mark-request-wait-for-signature";

const makeRequestAsWaitForSignatureHandler = (db: Database) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestToBeSigned),
    TE.fromEither
  );
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const markAsWaitForSignature = makeMarkRequestAsWaitForSignature(
    getSignatureRequest,
    upsertSignatureRequest
  );
  return createHandler(
    getSignatureRequestFromQueue,
    markAsWaitForSignature,
    identity,
    () => undefined
  );
};

export const makeRequestAsWaitForSignatureFunction = flow(
  makeRequestAsWaitForSignatureHandler,
  azure.unsafeRun
);
