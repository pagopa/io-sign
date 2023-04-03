import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import {
  Configuration,
  SignatureRequestApi,
  CreateSignatureRequestBody,
  GetSignatureRequestRequest,
} from "@io-sign/io-sign-api-client";
import { callSigners } from "./signer";

export const callSignatureRequests = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
) => {
  if (signatureRequest.id) {
    if (signatureRequest.documentId) {
      await callGetDocumentUploadUrl(
        configuration,
        signatureRequest.id,
        signatureRequest.documentId
      );
    } else if (signatureRequest.status && signatureRequest.status !== "READY") {
      await callSendNotification(configuration, signatureRequest.id);
    } else if (
      signatureRequest.status !== undefined &&
      signatureRequest.status === "READY"
    ) {
      await callSetSignatureRequestStatus(configuration, signatureRequest.id);
    } else {
      const request: GetSignatureRequestRequest = {
        id: signatureRequest.id,
      };
      await getSignatureRequest(configuration, request);
    }
  } else if (signatureRequest.signerId && signatureRequest.dossierId) {
    if (FiscalCode.is(signatureRequest.signerId)) {
      const signer = await callSigners(
        configuration,
        signatureRequest.signerId
      );
      // eslint-disable-next-line functional/immutable-data
      signatureRequest.signerId = signer.id;
    }
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  return api.getDocumentUploadUrl({
    reqId: signatureRequestId,
    docId: documentId,
  });
};

const callSendNotification = async (
  configuration: Configuration,
  signatureRequestId: string
) => {
  const api = new SignatureRequestApi(configuration);
  return api.sendNotification({ reqId: signatureRequestId });
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
