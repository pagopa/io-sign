//import * as inquirer from "inquirer";

import {
  Configuration,
  SignatureRequestApi,
  CreateSignatureRequestBody,
  GetSignatureRequestRequest
} from "@io-sign/io-sign-api-client";
//import {
//  createSignatureRequestQuestion,
//  changeSignatureRequestStatusQuestion,
//} from "./questions";

export const callSignatureRequests = async (configuration: Configuration, signatureRequest: any) => {

if (signatureRequest.id != null) {
	const request: GetSignatureRequestRequest = {
		id: signatureRequest.id
	};
      await callGetSignatureRequest(configuration, request);
	  /*
if(signatureRequest.documentId != null) {
      await callGetDocumentUploadUrl(configuration, signatureRequest.id, signatureRequest.documentId);
}
if(signatureRequest.dossierId) {

      await callSendNotification(configuration);
    case "setSignatureRequestStatus":
      await callSetSignatureRequestStatus(configuration);
} else{
      await callCreateSignatureRequest(configuration, signatureRequest);
	  */
  } else if (signatureRequest.signerId != null && signatureRequest.dossierId) {
      await callCreateSignatureRequest(configuration, signatureRequest);
  }
};

const callGetSignatureRequest = async (configuration: Configuration, request: GetSignatureRequestRequest) => {
  const api = new SignatureRequestApi(configuration);
  return api.getSignatureRequest(request);
};
/*
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
    return api.setSignatureRequestStatus({
      id: answerSetSignatureRequestStatus.req_id,
      body: "READY",
    });
  }
};
*/
const callCreateSignatureRequest = async (configuration: Configuration, signatureRequest: any) => {
  const api = new SignatureRequestApi(configuration);
    const createSignatureRequestBody: CreateSignatureRequestBody = {
      dossierId: signatureRequest.dossierId,
      signerId: signatureRequest.signerId,
//      expiresAt: answerCreateSignatureRequest.expires_at,
    };
    return api.createSignatureRequest({ createSignatureRequestBody });
};