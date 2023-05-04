
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await createSignatureRequest(configuration, signatureRequest).then((req: any) => {
console.log("1");
        // eslint-disable-next-line functional/immutable-data
        signatureRequest.id = req.id;
  const request: GetSignatureRequestRequest = {
    id: signatureRequest.id,
  };
  getSignatureRequest(configuration, request).then((req) => {
    // eslint-disable-next-line functional/immutable-data
    signatureRequest = { ...signatureRequest, ...req };
	return signatureRequest;
  }).then((result) => {
console.log("2");
  callUploadFile(configuration, result)
  return result;
  }).then((result) => {
console.log("3");
  let i: number = 0;
  let count: number = 0;
  while (count < 5 && signatureRequest.documents.length > i) {
    i = 0;
    count++;
    getSignatureRequest(configuration, request).then((req) => {
      req.documents.forEach((element: any) => {
        if (element.status === "READY") {
          i++;
      // eslint-disable-next-line functional/immutable-data
      signatureRequest.documents[i].status = "READY";
        }
      });
    });
    sleep(1);
  }
  if (signatureRequest.documents.length === i) {
      // eslint-disable-next-line functional/immutable-data
      signatureRequest.status = "SET_READY";
  }
  return signatureRequest;
}).then((result) => {
console.log("4");
      callSetSignatureRequestStatus(configuration, result);
      getSignatureRequest(configuration, request).then((req) => {
        // eslint-disable-next-line functional/immutable-data
        signatureRequest = req;
      });
      return signatureRequest;
    }).then((result) => {
console.log("5");
            callSendNotification(configuration, result);
            getSignatureRequest(configuration, request).then((req) => {
              // eslint-disable-next-line functional/immutable-data
              signatureRequest = req;
            });
            return signatureRequest;
          });
	})
.catch((err) => {
  console.error("errore signatureRequest series: ");
  console.error(err);
});
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
    dossierId: signatureRequest.dossier.id,
    signerId: signatureRequest.signerId,
//          expiresAt: signatureRequest.expiresAt
  };
  return api.createSignatureRequest({ createSignatureRequestBody });
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
    if (signatureRequest.status && signatureRequest.status === "WAITING_FOR_SIGNATURE") {
  const api = new SignatureRequestApi(configuration);
  return api.sendNotification({ reqId: signatureRequest.id });
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
  }
};

const callUploadFile = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
) => {
  if (signatureRequest.dossier && signatureRequest.dossier.documentsMetadata["0"].path) {
    for (
      let i = 0;
      i < signatureRequest.dossier.documentsMetalength;
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
