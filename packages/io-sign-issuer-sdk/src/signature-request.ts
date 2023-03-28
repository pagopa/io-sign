import {
  Configuration,
  SignatureRequestApi,
  CreateSignatureRequestBody,
  GetSignatureRequestRequest
} from "@io-sign/io-sign-api-client";

export const callSignatureRequests = async (configuration: Configuration, signatureRequest: any) => {
if (signatureRequest.id != null) {
	const request: GetSignatureRequestRequest = {
		id: signatureRequest.id
	};
      await callGetSignatureRequest(configuration, request);
  } else if (signatureRequest.signerId != null && signatureRequest.dossierId) {
      await callCreateSignatureRequest(configuration, signatureRequest);
  }
};

const callGetSignatureRequest = async (configuration: Configuration, request: GetSignatureRequestRequest) => {
  const api = new SignatureRequestApi(configuration);
  return api.getSignatureRequest(request);
};

const callCreateSignatureRequest = async (configuration: Configuration, signatureRequest: any) => {
  const api = new SignatureRequestApi(configuration);
    const createSignatureRequestBody: CreateSignatureRequestBody = {
      dossierId: signatureRequest.dossierId,
      signerId: signatureRequest.signerId,
//      expiresAt: "2023-04-24"
    };
    return api.createSignatureRequest({ createSignatureRequestBody });
};