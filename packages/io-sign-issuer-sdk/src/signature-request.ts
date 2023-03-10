import inquirer from "inquirer";

import { createConfiguration } from "@io-sign/io-sign-api-client";
import { RequestContext } from "@io-sign/io-sign-api-client/http/http";
import { SignatureRequestApiRequestFactory } from "@io-sign/io-sign-api-client/apis/SignatureRequestApi";
import { CreateSignatureRequestBody } from "@io-sign/io-sign-api-client/models/CreateSignatureRequestBody";
import { createResponse, EndpointResponse } from "./utilities";
import {
  signatureRequestIdQuestion,
  dossierIdQuestion,
  signerIdQuestion,
  expiresAtQuestion,
  createSignatureRequestQuestion,
  changeSignatureRequestStatusQuestion,
  signatureRequestFirstQuestion,
} from "./questions";

export const callSignatureRequests = async () => {
  const answerSignatureRequests = await inquirer.prompt([
    signatureRequestFirstQuestion,
  ]);
  switch (answerSignatureRequests.command) {
    case "getSignatureRequest":
      await callGetSignatureRequest();
      break;
    case "getDocumentUploadUrl":
      await callGetDocumentUploadUrl();
      break;
    case "sendNotification":
      await callSendNotification();
      break;
    case "setSignatureRequestStatus":
      await callSetSignatureRequestStatus();
      break;
    case "createSignatureRequest":
      await callCreateSignatureRequest();
      break;
  }
};

const callGetSignatureRequest = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignatureRequestApiRequestFactory(configuration);
  const answerGetSignatureRequest = await inquirer.prompt([
    signatureRequestIdQuestion,
  ]);
  apiInstance
    .getSignatureRequest(answerGetSignatureRequest.id)
    .then((data: RequestContext) => {
      createResponse(data)
        .then((data: EndpointResponse) => {
          console.log(data);
        })
        .catch((error: any) => console.error(error));
    })
    .catch((error: any) => console.error(error));
};

const callGetDocumentUploadUrl = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignatureRequestApiRequestFactory(configuration);
  const answerGetDocumentUploadUrl = await inquirer.prompt([
    signatureRequestIdQuestion,
    dossierIdQuestion,
  ]);
  apiInstance
    .getDocumentUploadUrl(
      answerGetDocumentUploadUrl.req_id,
      answerGetDocumentUploadUrl.doc_id
    )
    .then((data: RequestContext) => {
      createResponse(data)
        .then((data: EndpointResponse) => {
          console.log(data);
        })
        .catch((error: any) => console.error(error));
    })
    .catch((error: any) => console.error(error));
};

const callSendNotification = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignatureRequestApiRequestFactory(configuration);
  const answerSendNotification = await inquirer.prompt([
    signatureRequestIdQuestion,
  ]);
  apiInstance
    .sendNotification(answerSendNotification.req_id)
    .then((data: RequestContext) => {
      createResponse(data)
        .then((data: EndpointResponse) => {
          console.log(data);
        })
        .catch((error: any) => console.error(error));
    })
    .catch((error: any) => console.error(error));
};

const callSetSignatureRequestStatus = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignatureRequestApiRequestFactory(configuration);
  const answerSetSignatureRequestStatus = await inquirer.prompt([
    signatureRequestIdQuestion,
    changeSignatureRequestStatusQuestion,
  ]);
  if (answerSetSignatureRequestStatus.isReady) {
    apiInstance
      .setSignatureRequestStatus(
        answerSetSignatureRequestStatus.req_id,
        "READY"
      )
      .then((data: RequestContext) => {
        createResponse(data)
          .then((data: EndpointResponse) => {
            console.log(data);
          })
          .catch((error: any) => console.error(error));
      })
      .catch((error: any) => console.error(error));
  }
};

const callCreateSignatureRequest = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignatureRequestApiRequestFactory(configuration);
  const answerCreateSignatureRequest = await inquirer.prompt([
    dossierIdQuestion,
    signerIdQuestion,
    expiresAtQuestion,
    createSignatureRequestQuestion,
  ]);
  if (answerCreateSignatureRequest.isReady) {
    const body: CreateSignatureRequestBody = {
      dossierId: answerCreateSignatureRequest.dossier_id,
      signerId: answerCreateSignatureRequest.signer_id,
      expiresAt: answerCreateSignatureRequest.expires_at,
    };
    apiInstance
      .createSignatureRequest(body)
      .then((data: RequestContext) => {
        createResponse(data)
          .then((data: EndpointResponse) => {
            console.log(data);
          })
          .catch((error: any) => console.error(error));
      })
      .catch((error: any) => console.error(error));
  }
};
