import * as inquirer from "inquirer";

import {
  Configuration,
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

export const callSignatureRequests = async (configuration: Configuration) => {
  const answerSignatureRequests = await inquirer.prompt([
    signatureRequestFirstQuestion,
  ]);
  switch (answerSignatureRequests.command) {
    case "getSignatureRequest":
      await callGetSignatureRequest(configuration);
      break;
    case "getDocumentUploadUrl":
      await callGetDocumentUploadUrl(configuration);
      break;
    case "sendNotification":
      await callSendNotification(configuration);
      break;
    case "setSignatureRequestStatus":
      await callSetSignatureRequestStatus(configuration);
      break;
    case "createSignatureRequest":
      await callCreateSignatureRequest(configuration);
      break;
  }
};

const callGetSignatureRequest = async (configuration: Configuration) => {
  const api = new SignatureRequestApi(configuration);
  const answerGetSignatureRequest = await inquirer.prompt([
    signatureRequestIdQuestion,
  ]);
  return api.getSignatureRequest(answerGetSignatureRequest.id);
};

const callGetDocumentUploadUrl = async (configuration: Configuration) => {
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

const callSendNotification = async (configuration: Configuration) => {
  const api = new SignatureRequestApi(configuration);
  const answerSendNotification = await inquirer.prompt([
    signatureRequestIdQuestion,
  ]);
  return api.sendNotification(answerSendNotification.req_id);
};

const callSetSignatureRequestStatus = async (configuration: Configuration) => {
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

const callCreateSignatureRequest = async (configuration: Configuration) => {
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
