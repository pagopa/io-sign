import { Database as CosmosDatabase } from "@azure/cosmos";

import * as TE from "fp-ts/lib/TaskEither";

import { error, success } from "@internal/io-sign/infra/http/response";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { flow } from "fp-ts/lib/function";
import { createHandler } from "@pagopa/handler-kit";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { SignatureRequestDetailView } from "../../http/models/SignatureRequestDetailView";
import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";
import { makeGetSignatureRequest } from "../cosmos/signature-request";

const makeGetSignatureRequestHandler = (db: CosmosDatabase) => {
  const getSignatureRequest = makeGetSignatureRequest(db);

  const requireSignatureRequest = makeRequireSignatureRequest(
    mockGetIssuerBySubscriptionId,
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
    TE.right,
    error,
    encodeHttpSuccessResponse
  );
};

export const makeGetSignatureRequestFunction = flow(
  makeGetSignatureRequestHandler,
  azure.unsafeRun
);
