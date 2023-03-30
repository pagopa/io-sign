import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { callSigners } from './signer';
import {
  Configuration,
  SignatureRequestApi,
  CreateSignatureRequestBody,
  GetSignatureRequestRequest,
} from "@io-sign/io-sign-api-client";

export const callSignatureRequests = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
) => {
  if (signatureRequest.id != null) {
		if     (signatureRequest.documentId != null) {
			await callGetDocumentUploadUrl(configuration, signatureRequest.id, signatureRequest.documentId);
		} else if (signatureRequest.status != undefined && signatureRequest.status != "READY") {
			await callSendNotification(configuration, signatureRequest.id);
		} else if (signatureRequest.status != undefined && signatureRequest.status == "READY") {
			await callSetSignatureRequestStatus(configuration, signatureRequest.id);
		} else {
			const request: GetSignatureRequestRequest = {
				id: signatureRequest.id,
			};
			await getSignatureRequest(configuration, request);
			}
	} else if (signatureRequest.signerId != null && signatureRequest.dossierId) {
	  console.log(signatureRequest);
	  if (signatureRequest.signerId instanceof FiscalCode) {
		  const signer= await callSigners(configuration, signatureRequest.signerId);
signatureRequest.signerId = signer.id;
	  }
	  console.log(signatureRequest);
//      await callCreateSignatureRequest(configuration, signatureRequest);
	}
};

const getSignatureRequest = async (
  configuration: Configuration,
  request: GetSignatureRequestRequest
) => {
  const api = new SignatureRequestApi(configuration);
  return api.getSignatureRequest(request);
};

const createSignatureRequest = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
) => {
  const api = new SignatureRequestApi(configuration);
  const createSignatureRequestBody: CreateSignatureRequestBody = {
    dossierId: signatureRequest.dossierId,
    signerId: signatureRequest.signerId,
    //      expiresAt: "2023-04-24"
  };
  return api.createSignatureRequest({ createSignatureRequestBody });
};

const callGetDocumentUploadUrl = async (
	configuration: Configuration, 
	signatureRequestId: string, 
	documentId: string
) => {
  const api = new SignatureRequestApi(configuration);
  return api.getDocumentUploadUrl( {
    "reqId": signatureRequestId,
    "docId": documentId
  });
};

const callSendNotification = async (
	configuration: Configuration, 
	signatureRequestId: string
) => {
  const api = new SignatureRequestApi(configuration);
  return api.sendNotification({ "reqId": signatureRequestId });
};

const callSetSignatureRequestStatus = async (
	configuration: Configuration, 
	signatureRequestId: string
) => {
  const api = new SignatureRequestApi(configuration);
    return api.setSignatureRequestStatus({
      id: signatureRequestId,
      body: "READY",
    });
};

