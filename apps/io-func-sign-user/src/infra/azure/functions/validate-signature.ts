import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";

import { flow, identity, constVoid } from "fp-ts/lib/function";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";

import { Database } from "@azure/cosmos";

import {
  makeValidateSignature,
  ValidateSignaturePayload,
} from "../../../app/use-cases/validate-signature";
import { makeGetSignature, makeUpsertSignature } from "../cosmos/signature";
import { makeGetToken } from "../../namirial/client";
import { makeGetSignatureRequestWithToken } from "../../namirial/signature-request";
import { NamirialConfig } from "../../namirial/config";

const makeValidateSignatureHandler = (
  db: Database,
  tokenizer: PdvTokenizerClientWithApiKey,
  qtspConfig: NamirialConfig
) => {
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const getSignature = makeGetSignature(db);
  const upsertSignature = makeUpsertSignature(db);

  const getQtspSignatureRequest = makeGetSignatureRequestWithToken()(
    makeGetToken()
  )(qtspConfig);

  const validateSignature = makeValidateSignature(
    getFiscalCodeBySignerId,
    getSignature,
    upsertSignature,
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
