import {
  Configuration,
  SignatureRequestApi,
  CreateSignatureRequestBody,
  GetSignatureRequestRequest,
} from "@io-sign/io-sign-api-client";
import { callDocumentUpload } from "./upload-file";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const callSignatureRequests = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
) => {
  if (!signatureRequest.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createSignatureRequest(configuration, signatureRequest).then((req: any) => {
        // eslint-disable-next-line functional/immutable-data
        signatureRequest = { ...signatureRequest, ...req };
      });
  }
  const request: GetSignatureRequestRequest = {
    id: signatureRequest.id,
  };
  await getSignatureRequest(configuration, request).then((req) => {
    // eslint-disable-next-line functional/immutable-data
    signatureRequest = { ...signatureRequest, ...req };
  });
  await callUploadFile(configuration, signatureRequest);
  let i: number = 0;
  let count: number = 0;
  while (count < 5 && signatureRequest.documents.length > i) {
    i = 0;
    count++;
    await getSignatureRequest(configuration, request).then((req) => {
      req.documents.forEach((element: any) => {
        if (element.status === "READY") {
          i++;
        }
      });
    });
    await sleep(1);
  }
  if (signatureRequest.documents.length === i) {
    if (signatureRequest.status && signatureRequest.status === "DRAFT") {
      await callSetSignatureRequestStatus(configuration, signatureRequest.id);
      await getSignatureRequest(configuration, request).then((req) => {
        // eslint-disable-next-line functional/immutable-data
        signatureRequest = { ...signatureRequest, ...req };
      });
    }

    if (signatureRequest.status && signatureRequest.status === "WAIT_FOR_SIGNATURE") {
            await callSendNotification(configuration, signatureRequest.id);
            await getSignatureRequest(configuration, request).then((req) => {
              // eslint-disable-next-line functional/immutable-data
              signatureRequest = { ...signatureRequest, ...req };
            });
              }
  }
  return Promise.resolve(signatureRequest);
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

const callUploadFile = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
) => {
  if (signatureRequest.dossier && signatureRequest.dossier.documentsMetadata["0"].path) {
    for (
      let i = 0;
      i < signatureRequest.dossier.documentsMetadata.length;
      i++
    ) {
      callGetDocumentUploadUrl(
        configuration,
        signatureRequest.id,
        signatureRequest.documents[i].id
      ).then((documentUploadUrl: string) =>
        callDocumentUpload(
          signatureRequest.dossier.documentsMetadata[i].path,
          documentUploadUrl.replaceAll('"', "")
        )
      );
    }
  }
};
