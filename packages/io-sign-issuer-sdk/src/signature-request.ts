import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import {
  Configuration,
  SignatureRequestApi,
  CreateSignatureRequestBody,
  GetSignatureRequestRequest,
} from "@io-sign/io-sign-api-client";
import { callSigners } from "./signer";
import { callDossier } from "./dossier";
import { callDocumentUpload } from "./upload-file";

export const callSignatureRequests = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signatureRequest: any
) => {
  if (signatureRequest.id) {
    if (signatureRequest.status && signatureRequest.status == "READY") {
      return callSendNotification(configuration, signatureRequest.id);
    } else if (signatureRequest.status && signatureRequest.status !== "READY") {
      return callSetSignatureRequestStatus(configuration, signatureRequest.id);
    }
  } else {
    if (FiscalCode.is(signatureRequest.signerId)) {
      const signer = await callSigners(
        configuration,
        signatureRequest.signerId
      );
      // eslint-disable-next-line functional/immutable-data
      signatureRequest.signerId = signer.id;
    }
	
	    if (!signatureRequest.dossier.id) {
      const dossier = await callDossier(
        configuration,
        signatureRequest.dossier
      );
      // eslint-disable-next-line functional/immutable-data
      signatureRequest.dossierId = dossier.id;
    }
  await createSignatureRequest(configuration, signatureRequest).then((req: any) => {
      // eslint-disable-next-line functional/immutable-data
	  signatureRequest = { ...signatureRequest, ...req };
  }).catch((err) => console.error("Errore nella create: "+err));
  }
      const request: GetSignatureRequestRequest = {
        id: signatureRequest.id,
      };
      await getSignatureRequest(configuration, request)
	  .then((req) => {
        // eslint-disable-next-line functional/immutable-data
	  signatureRequest = { ...signatureRequest, ...req };
	  });
	// to do: this check could be done by a regular expression that checks if there is almost one "documentPath" into documentsMetadata and upload only where it is present
			if (signatureRequest.dossier && signatureRequest.dossier.documentsMetadata["0"].path ) {
				await callUploadFile(configuration, signatureRequest);
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
	for (let i=0; i< signatureRequest.dossier.documentsMetadata.length; i++) {
callGetDocumentUploadUrl(
        configuration,
        signatureRequest.id,
        signatureRequest.documents[i].id
      ).then((documentUploadUrl: string) => {
		 return callDocumentUpload(signatureRequest.dossier.documentsMetadata[i].path, documentUploadUrl.replaceAll("\"",""));
	  });
			}
};
