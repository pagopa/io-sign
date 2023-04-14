import { Database } from "@azure/cosmos";

import * as azure from "handler-kit-legacy/lib/azure";
import { createHandler } from "handler-kit-legacy";

import * as TE from "fp-ts/lib/TaskEither";
import { identity, flow } from "fp-ts/lib/function";

import { SignatureRequestRejected } from "@io-sign/io-sign/signature-request";

import { makeSubmitMessageForUser } from "@io-sign/io-sign/infra/io-services/message";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeMarkRequestAsRejected } from "../../../app/use-cases/mark-request-rejected";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";
import { makeGetDossier } from "../cosmos/dossier";

const makeRequestAsRejectedHandler = (
  db: Database,
  tokenizer: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient
) => {
  const getSignatureRequestFromQueue = flow(
    azure.fromQueueMessage(SignatureRequestRejected),
    TE.fromEither
  );
  const getDossier = makeGetDossier(db);
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const submitMessage = makeSubmitMessageForUser(ioApiClient);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);

  const markAsRejected = makeMarkRequestAsRejected(
    getDossier,
    getSignatureRequest,
    upsertSignatureRequest,
    submitMessage,
    getFiscalCodeBySignerId
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
