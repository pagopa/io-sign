/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-let */
import {
  Configuration,
  SignatureRequestApi,
  CreateSignatureRequestBody,
  GetSignatureRequestRequest,
  SignatureRequestDetailView,
  DocumentDetailView,
} from "@io-sign/io-sign-api-client";
import { callDocumentUpload } from "./upload-file";
import { SdkSchemaWithSignatureRequest } from "./schema";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const callSignatureRequests = async (
  configuration: Configuration,
  data: SdkSchemaWithSignatureRequest
) => {
  try {
    await createSignatureRequest(configuration, data.signatureRequest).then(
      (req: SignatureRequestDetailView) => {
        data.signatureRequest.id = req.id;
      }
    );

    const request: GetSignatureRequestRequest = {
      id: data.signatureRequest.id,
    };
    await getSignatureRequest(configuration, request).then((req) => {
      data.signatureRequest = { ...data.signatureRequest, ...req };
    });
    await callUploadFile(configuration, data);
    let i: number = 0;
    let count: number = 0;
    if (data.signatureRequest.status === "DRAFT") {
      while (count < 5 && data.signatureRequest.documents.length > i) {
        i = 0;
        count++;
        await getSignatureRequest(configuration, request).then((req) => {
          req.documents.forEach((element: DocumentDetailView) => {
            if (element.status === "READY") {
              i++;
            }
          });
          data.signatureRequest = req;
        });
        await sleep(10000);
      }
      if (data.signatureRequest.documents.length === i) {
        data.signatureRequest.status = "SET_READY";
      }
    }
    await callSetSignatureRequestStatus(configuration, data.signatureRequest);
    await getSignatureRequest(configuration, request).then((req) => {
      data.signatureRequest = req;
    });
    count = 0;
    if (data.signatureRequest.status === "READY") {
      while (count < 5 && data.signatureRequest.status === "READY") {
        count++;

        await getSignatureRequest(configuration, request).then((req) => {
          data.signatureRequest = req;
        });
        await callSendNotification(configuration, data.signatureRequest);
        await sleep(10000);
      }
    }
    await getSignatureRequest(configuration, request).then((req) => {
      data.signatureRequest = req;
    });

    return data.signatureRequest;
  } catch (err) {
    throw new Error(`errore signatureRequest series: ${err}`);
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
  signatureRequest: SignatureRequestDetailView
) => {
  if (!signatureRequest.id) {
    const api = new SignatureRequestApi(configuration);
    const createSignatureRequestBody: CreateSignatureRequestBody = {
      dossierId: signatureRequest.dossierId,
      signerId: signatureRequest.signerId,
      //          expiresAt: signatureRequest.expiresAt
    };
    return api.createSignatureRequest({ createSignatureRequestBody });
  } else {
    return signatureRequest;
  }
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
  signatureRequest: SignatureRequestDetailView
) => {
  if (
    signatureRequest.status &&
    signatureRequest.status === "WAIT_FOR_SIGNATURE"
  ) {
    const api = new SignatureRequestApi(configuration);
    return api.sendNotification({ reqId: signatureRequest.id });
  } else {
    return signatureRequest;
  }
};

const callSetSignatureRequestStatus = async (
  configuration: Configuration,
  signatureRequest: SignatureRequestDetailView
) => {
  if (signatureRequest.status && signatureRequest.status === "SET_READY") {
    const api = new SignatureRequestApi(configuration);
    return api.setSignatureRequestStatus({
      id: signatureRequest.id,
      body: "READY",
    });
  } else {
    return signatureRequest;
  }
};

const callUploadFile = async (
  configuration: Configuration,
  data: SdkSchemaWithSignatureRequest
) => {
  if (data.signatureRequest.status === "DRAFT" && data.documentsPaths["0"]) {
          for (let i =0; i < data.signatureRequest.documents.length; i++) {
      const documentUploadUrl: string = await callGetDocumentUploadUrl(
        configuration,
        data.signatureRequest.id,
        data.signatureRequest.documents[i].id
      );
      console.log(i);
      console.log(data.signatureRequest.documents[i].id);
      console.log(data.documentsPaths[i]);
      console.log(documentUploadUrl.replaceAll('"', ""));
      await callDocumentUpload(
        data.documentsPaths[i],
        documentUploadUrl.replaceAll('"', "")
      );
    }
  }
};
