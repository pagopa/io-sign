import { Database as CosmosDatabase, CosmosClient } from "@azure/cosmos";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { error, success } from "@pagopa/handler-kit/lib/http";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { flow, identity, pipe } from "fp-ts/lib/function";
import { createHandler } from "@pagopa/handler-kit";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { SignatureRequestDetailView } from "../../http/models/SignatureRequestDetailView";
import { makeRequireSignatureRequest } from "../../http/decoders/signature-request";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";
import { makeGetSignatureRequest } from "../cosmos/signature-request";
import { getConfigFromEnvironment } from "../../../app/config";

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

const configOrError = pipe(
  getConfigFromEnvironment(process.env),
  E.getOrElseW(identity)
);

if (configOrError instanceof Error) {
  throw configOrError;
}

const config = configOrError;

const cosmosClient = new CosmosClient(config.azure.cosmos.connectionString);
const database = cosmosClient.database(config.azure.cosmos.dbName);

export const run = pipe(
  makeGetSignatureRequestHandler(database),
  azure.unsafeRun
);
