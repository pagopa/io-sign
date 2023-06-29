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
    console.log(`Signature request id: ${data.signatureRequest.id}`);

    await getSignatureRequest(configuration, request).then((req) => {
      data.signatureRequest = { ...data.signatureRequest, ...req };
    });
    await callUploadFile(configuration, data);
    await callSetReadySignatureRequestStatus(
      configuration,
      data.signatureRequest
    );
    await getSignatureRequest(configuration, request).then((req) => {
      data.signatureRequest = req;
    });

    let retryCount: number = 0;
    const maxRetryCount: number = process.env.RETRY_COUNT_CHANGE_STATUS
      ? Number.parseInt(process.env.RETRY_COUNT_CHANGE_STATUS)
      : 5;
    const retrySleepTime: number = process.env.RETRY_SLEEP_TIME_CHANGE_STATUS
      ? Number.parseInt(process.env.RETRY_SLEEP_TIME_CHANGE_STATUS)
      : 5000;
    while (
      retryCount < maxRetryCount &&
      data.signatureRequest.status === "READY"
    ) {
      retryCount++;
      await getSignatureRequest(configuration, request).then((req) => {
        data.signatureRequest = req;
      });
      await sleep(retrySleepTime);
    }
    if (data.signatureRequest.status === "WAIT_FOR_SIGNATURE") {
      console.log(
        "The status of the signature request has changed to WAIT_FOR_SIGNATURE"
      );
    } else {
      console.log("The status of the signature request has not changed");
    }

    await callSendNotification(configuration, data.signatureRequest);

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
      //                expiresAt: signatureRequest.expiresAt
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
    signatureRequest.status === "WAIT_FOR_SIGNATURE" &&
    !signatureRequest.notification
  ) {
    const api = new SignatureRequestApi(configuration);
    return api.sendNotification({ reqId: signatureRequest.id });
  } else {
    return signatureRequest;
  }
};

const callSetReadySignatureRequestStatus = async (
  configuration: Configuration,
  signatureRequest: SignatureRequestDetailView
) => {
  if (signatureRequest.status && signatureRequest.status === "DRAFT") {
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
  const request: GetSignatureRequestRequest = {
    id: data.signatureRequest.id,
  };

  if (data.signatureRequest.status === "DRAFT" && data.documentsPaths) {
    if (data.documentsPaths.length === data.signatureRequest.documents.length) {
      for (let i = 0; i < data.signatureRequest.documents.length; i++) {
        const documentUploadUrl: string = await callGetDocumentUploadUrl(
          configuration,
          data.signatureRequest.id,
          data.signatureRequest.documents[i].id
        );
        console.log(
          `Uploading document with id: ${data.signatureRequest.documents[i].id}`
        );

        await callDocumentUpload(
          data.documentsPaths[i],
          documentUploadUrl.replaceAll('"', "")
        );
      }
      let retryCount: number = 0;
      const maxRetryCount: number = process.env.RETRY_COUNT_UPLOAD
        ? Number.parseInt(process.env.RETRY_COUNT_UPLOAD)
        : 5;
      const retrySleepTime: number = process.env.RETRY_SLEEP_TIME_UPLOAD
        ? Number.parseInt(process.env.RETRY_SLEEP_TIME_UPLOAD)
        : 5000;
      let documentsReadyCount: number = 0;
      while (
        retryCount < maxRetryCount &&
        documentsReadyCount < data.documentsPaths.length
      ) {
        retryCount++;
        documentsReadyCount = 0;
        await getSignatureRequest(configuration, request).then((req) => {
          data.signatureRequest = req;
          req.documents.forEach((document) => {
            if (document.status === "READY") {
              documentsReadyCount++;
            }
          });
        });
        await sleep(retrySleepTime);
      }
      if (data.documentsPaths.length === documentsReadyCount) {
        console.log(
          "The documents have been uploaded, I am waiting for the READY status"
        );
      } else {
        throw new Error(
          "Timeout expired, an error occurred while uploading the files"
        );
      }
    } else {
      console.error(
        `The number of documents required by the signature request (${data.signatureRequest.documents.length}) differs from the list of submitted documents (${data.documentsPaths.length})`
      );
    }
  } else {
    console.error(`Signature request is not in DRAFT status`);
  }
};
