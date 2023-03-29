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
  if (signatureRequest.id !== null) {
    const request: GetSignatureRequestRequest = {
      id: signatureRequest.id,
    };
    await getSignatureRequest(configuration, request);
  } else if (signatureRequest.signerId != null && signatureRequest.dossierId) {
    await createSignatureRequest(configuration, signatureRequest);
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
