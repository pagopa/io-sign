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
  data: any
) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createSignatureRequest(configuration, data.signatureRequest).then(
      (req: any) => {
        // eslint-disable-next-line functional/immutable-data
        data.signatureRequest.id = req.id;
      }
    );

    const request: GetSignatureRequestRequest = {
      id: data.signatureRequest.id,
    };
    await getSignatureRequest(configuration, request).then((req) => {
      // eslint-disable-next-line functional/immutable-data
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
          req.documents.forEach((element: any) => {
            if (element.status === "READY") {
              i++;
            }
          });
          // eslint-disable-next-line functional/immutable-data
          data.signatureRequest = req;
        });
        await sleep(10000);
      }
      if (data.signatureRequest.documents.length === i) {
        // eslint-disable-next-line functional/immutable-data
        data.signatureRequest.status = "SET_READY";
      }
    }
    await callSetSignatureRequestStatus(configuration, data.signatureRequest);
    await getSignatureRequest(configuration, request).then((req) => {
      // eslint-disable-next-line functional/immutable-data
      data.signatureRequest = req;
    });
    count = 0;
    if (data.signatureRequest.status === "READY") {
      while (count < 5 && data.signatureRequest.status === "READY") {
        count++;

        await getSignatureRequest(configuration, request).then((req) => {
          // eslint-disable-next-line functional/immutable-data
          data.signatureRequest = req;
        });
        await callSendNotification(configuration, data.signatureRequest);
        await sleep(10000);
      }
    }
    await getSignatureRequest(configuration, request).then((req) => {
      // eslint-disable-next-line functional/immutable-data
      data.signatureRequest = req;
    });

    return data.signatureRequest;
  } catch (err) {
    throw "errore signatureRequest series: " + err;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
) => {
  if (
    data.signatureRequest.status === "DRAFT" &&
    data.dossier &&
    data.dossier.documentsMetadata["0"].path
  ) {
    for (let i = 0; i < data.signatureRequest.documents.length; i++) {
      const documentUploadUrl: string = await callGetDocumentUploadUrl(
        configuration,
        data.signatureRequest.id,
        data.signatureRequest.documents[i].id
      );
      await callDocumentUpload(
        data.dossier.documentsMetadata[i].path,
        documentUploadUrl.replaceAll('"', "")
      );
    }
  }
};
