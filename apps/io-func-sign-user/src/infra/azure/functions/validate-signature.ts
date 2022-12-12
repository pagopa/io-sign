import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { flow, identity, constVoid } from "fp-ts/lib/function";

import { Database } from "@azure/cosmos";

import { ContainerClient } from "@azure/storage-blob";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { makeSubmitMessageForUser } from "@io-sign/io-sign/infra/io-services/message";

import {
  makeValidateSignature,
  ValidateSignaturePayload,
} from "../../../app/use-cases/validate-signature";
import { makeGetSignature, makeUpsertSignature } from "../cosmos/signature";
import { makeGetToken } from "../../namirial/client";
import { makeGetSignatureRequestWithToken } from "../../namirial/signature-request";
import { NamirialConfig } from "../../namirial/config";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";
import { makeGetBlobUrl } from "../storage/blob";

const makeValidateSignatureHandler = (
  ioApiClient: IOApiClient,
  tokenizer: PdvTokenizerClientWithApiKey,
  db: Database,
  signedContainerClient: ContainerClient,
  qtspConfig: NamirialConfig
) => {
  const getSignature = makeGetSignature(db);
  const upsertSignature = makeUpsertSignature(db);
  const getSignatureRequest = makeGetSignatureRequest(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const getSignedDocumentUrl = makeGetBlobUrl(signedContainerClient);
  const submitMessage = makeSubmitMessageForUser(ioApiClient);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);

  const getQtspSignatureRequest = makeGetSignatureRequestWithToken()(
    makeGetToken()
  )(qtspConfig);

  const validateSignature = makeValidateSignature(
    submitMessage,
    getFiscalCodeBySignerId,
    getSignature,
    getSignedDocumentUrl,
    upsertSignature,
    getSignatureRequest,
    upsertSignatureRequest,
    getQtspSignatureRequest
  );

  const decodeQueueMessage = flow(
    azure.fromQueueMessage(ValidateSignaturePayload),
    TE.fromEither
  );

  return createHandler(
    decodeQueueMessage,
    validateSignature,
    identity,
    constVoid
  );
};

export const makeValidateSignatureFunction = flow(
  makeValidateSignatureHandler,
  azure.unsafeRun
);
