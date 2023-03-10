import inquirer from "inquirer";

import {
  createConfiguration,
  SignatureRequestApi,
} from "@io-sign/io-sign-api-client";
import { CreateSignatureRequestBody } from "@io-sign/io-sign-api-client/models/CreateSignatureRequestBody";
import {
  signatureRequestIdQuestion,
  dossierIdQuestion,
  signerIdQuestion,
  expiresAtQuestion,
  createSignatureRequestQuestion,
  changeSignatureRequestStatusQuestion,
  signatureRequestFirstQuestion,
} from "./questions";

export const callSignatureRequests = async () => {
  const answerSignatureRequests = await inquirer.prompt([
    signatureRequestFirstQuestion,
  ]);
  switch (answerSignatureRequests.command) {
    case "getSignatureRequest":
      await callGetSignatureRequest();
      break;
    case "getDocumentUploadUrl":
      await callGetDocumentUploadUrl();
      break;
    case "sendNotification":
      await callSendNotification();
      break;
    case "setSignatureRequestStatus":
      await callSetSignatureRequestStatus();
      break;
    case "createSignatureRequest":
      await callCreateSignatureRequest();
      break;
  }
};

const callGetSignatureRequest = async (
  SubscriptionKey = process.env.SUBSCRIPTION_KEY
) => {
  const configuration = createConfiguration({
    authMethods: {
      SubscriptionKey,
    },
  });
  const api = new SignatureRequestApi(configuration);
  const answerGetSignatureRequest = await inquirer.prompt([
    signatureRequestIdQuestion,
  ]);
  return api.getSignatureRequest(answerGetSignatureRequest.id);
};

const callGetDocumentUploadUrl = async (
  SubscriptionKey = process.env.SUBSCRIPTION_KEY
) => {
  const configuration = createConfiguration({
    authMethods: {
      SubscriptionKey,
    },
  });
  const api = new SignatureRequestApi(configuration);
  const answerGetDocumentUploadUrl = await inquirer.prompt([
    signatureRequestIdQuestion,
    dossierIdQuestion,
  ]);
  return api.getDocumentUploadUrl(
    answerGetDocumentUploadUrl.req_id,
    answerGetDocumentUploadUrl.doc_id
  );
};

const callSendNotification = async (
  SubscriptionKey = process.env.SUBSCRIPTION_KEY
) => {
  const configuration = createConfiguration({
    authMethods: {
      SubscriptionKey,
    },
  });
  const api = new SignatureRequestApi(configuration);
  const answerSendNotification = await inquirer.prompt([
    signatureRequestIdQuestion,
  ]);
  return api.sendNotification(answerSendNotification.req_id);
};

const callSetSignatureRequestStatus = async (
  SubscriptionKey = process.env.SUBSCRIPTION_KEY
) => {
  const configuration = createConfiguration({
    authMethods: {
      SubscriptionKey,
    },
  });
  const api = new SignatureRequestApi(configuration);
  const answerSetSignatureRequestStatus = await inquirer.prompt([
    signatureRequestIdQuestion,
    changeSignatureRequestStatusQuestion,
  ]);
  if (answerSetSignatureRequestStatus.isReady) {
    return api.setSignatureRequestStatus(
      answerSetSignatureRequestStatus.req_id,
      "READY"
    );
  }
};

const callCreateSignatureRequest = async (
  SubscriptionKey = process.env.SUBSCRIPTION_KEY
) => {
  const configuration = createConfiguration({
    authMethods: {
      SubscriptionKey,
    },
  });
  const api = new SignatureRequestApi(configuration);
  const answerCreateSignatureRequest = await inquirer.prompt([
    dossierIdQuestion,
    signerIdQuestion,
    expiresAtQuestion,
    createSignatureRequestQuestion,
  ]);
  if (answerCreateSignatureRequest.isReady) {
    const body: CreateSignatureRequestBody = {
      dossierId: answerCreateSignatureRequest.dossier_id,
      signerId: answerCreateSignatureRequest.signer_id,
      expiresAt: answerCreateSignatureRequest.expires_at,
    };
    return api.createSignatureRequest(body);
  }
};
