import { Database } from "@azure/cosmos";

import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { flow, pipe } from "fp-ts/lib/function";

import { error, success } from "@io-sign/io-sign/infra/http/response";
import { ContainerClient } from "@azure/storage-blob";

import { map, sequence } from "fp-ts/lib/Array";

import { toDocumentWithSasUrl } from "@io-sign/io-sign/infra/azure/storage/document-url";
import { SignatureRequestDetailView } from "../../http/models/SignatureRequestDetailView";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { makeRequireSignatureRequest } from "../../http/decoder/signature-request";
import { makeGetSignatureRequest } from "../cosmos/signature-request";
import { SignatureRequest } from "../../../signature-request";

const grantReadAccessToDocuments = (request: SignatureRequest) =>
  pipe(
    request.documents,
    map(toDocumentWithSasUrl("r", 5)),
    sequence(RTE.ApplicativeSeq),
    RTE.map((documents) => ({ ...request, documents }))
  );

const makeGetSignatureRequestHandler = (
  db: Database,
  validatedContainerClient: ContainerClient,
  signedContainerClient: ContainerClient
) => {
  const requireSignatureRequest = pipe(
    makeGetSignatureRequest(db),
    makeRequireSignatureRequest
  );
  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireSignatureRequest)
  );
  const encodeHttpSuccessResponse = flow(
    SignatureRequestToApiModel.encode,
    success(SignatureRequestDetailView)
  );
  return createHandler(
    decodeHttpRequest,
    (request) =>
      pipe(
        request.status === "SIGNED"
          ? signedContainerClient
          : validatedContainerClient,
        grantReadAccessToDocuments(request)
      ),
    error,
    encodeHttpSuccessResponse
  );
};

export const makeGetSignatureRequestFunction = flow(
  makeGetSignatureRequestHandler,
  azure.unsafeRun
);
