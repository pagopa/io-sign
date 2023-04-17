import { Database as CosmosDatabase } from "@azure/cosmos";

import * as TE from "fp-ts/lib/TaskEither";

import { error, success } from "@io-sign/io-sign/infra/http/response";

import * as azure from "handler-kit-legacy/lib/azure";

import { createHandler } from "handler-kit-legacy";
import { ContainerClient } from "@azure/storage-blob";

import { pipe, flow } from "fp-ts/function";
import { map, sequence } from "fp-ts/lib/Array";

import { toDocumentWithSasUrl } from "@io-sign/io-sign/infra/azure/storage/document-url";

import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { makeGetIssuerBySubscriptionId } from "../cosmos/issuer";
import { makeGetSignatureRequest } from "../cosmos/signature-request";
import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { SignatureRequestDetailView } from "../../http/models/SignatureRequestDetailView";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";

const makeGrantReadAccessToDocuments =
  (containerClient: ContainerClient) => (request: SignatureRequestSigned) =>
    pipe(
      request.documents,
      map(toDocumentWithSasUrl("r", 5)),
      sequence(RTE.ApplicativeSeq),
      RTE.map(
        (documents): SignatureRequestSigned => ({ ...request, documents })
      )
    )(containerClient);

const makeGetSignatureRequestHandler = (
  db: CosmosDatabase,
  signedContainerClient: ContainerClient
) => {
  const getSignatureRequest = makeGetSignatureRequest(db);
  const getIssuerBySubscriptionId = makeGetIssuerBySubscriptionId(db);

  const grantReadAccessToDocuments = makeGrantReadAccessToDocuments(
    signedContainerClient
  );

  const requireSignatureRequest = makeRequireSignatureRequest(
    getIssuerBySubscriptionId,
    getSignatureRequest
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
        SignatureRequestSigned.decode(request),
        TE.fromEither,
        TE.mapLeft(
          () => new Error(`The Signature Request Status is ${request.status}.`)
        ),
        TE.chain(grantReadAccessToDocuments),
        TE.alt(() => TE.right(request))
      ),
    error,
    encodeHttpSuccessResponse
  );
};

export const makeGetSignatureRequestFunction = flow(
  makeGetSignatureRequestHandler,
  azure.unsafeRun
);
