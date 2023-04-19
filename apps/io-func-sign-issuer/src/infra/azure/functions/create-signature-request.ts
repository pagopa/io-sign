import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as O from "fp-ts/lib/Option";

import { HttpRequest } from "handler-kit-legacy/lib/http";

import { validate } from "@io-sign/io-sign/validation";

import { sequenceS } from "fp-ts/lib/Apply";

import { pipe, flow } from "fp-ts/lib/function";
import * as azure from "handler-kit-legacy/lib/azure";
import { createHandler } from "handler-kit-legacy";
import { Database as CosmosDatabase } from "@azure/cosmos";
import { created, error } from "@io-sign/io-sign/infra/http/response";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import { EventHubProducerClient } from "@azure/event-hubs";
import { EventName } from "@io-sign/io-sign/event";
import { makeRequireIssuer } from "../../http/decoders/issuer";
import { CreateSignatureRequestBody } from "../../http/models/CreateSignatureRequestBody";
import { SignatureRequest } from "../../../signature-request";
import { makeGetDossier } from "../cosmos/dossier";

import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { SignatureRequestDetailView } from "../../http/models/SignatureRequestDetailView";

import {
  CreateSignatureRequestPayload,
  makeCreateSignatureRequest,
} from "../../../app/use-cases/create-signature-request";

import { makeInsertSignatureRequest } from "../cosmos/signature-request";
import { mockGetSigner } from "../../__mocks__/signer";
import { makeGetIssuerBySubscriptionId } from "../cosmos/issuer";

const makeCreateSignatureRequestHandler = (
  db: CosmosDatabase,
  eventHubAnalyticsClient: EventHubProducerClient
) => {
  const getDossier = makeGetDossier(db);
  const getIssuerBySubscriptionId = makeGetIssuerBySubscriptionId(db);

  const insertSignatureRequest = makeInsertSignatureRequest(db);

  const createSignatureRequest = makeCreateSignatureRequest(
    insertSignatureRequest
  );

  const createAndSendAnalyticsEvent = makeCreateAndSendAnalyticsEvent(
    eventHubAnalyticsClient
  );
  const requireCreateSignatureRequestBody = flow(
    (req: HttpRequest) => req.body,
    validate(CreateSignatureRequestBody),
    E.map(
      (
        body
      ): Pick<SignatureRequest, "dossierId" | "signerId"> & {
        expiresAt: O.Option<Date>;
      } => ({
        dossierId: body.dossier_id,
        signerId: body.signer_id,
        expiresAt: O.fromNullable(body.expires_at),
      })
    )
  );

  const requireCreateSignatureRequestPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    CreateSignatureRequestPayload
  > = pipe(
    sequenceS(RTE.ApplyPar)({
      issuer: makeRequireIssuer(getIssuerBySubscriptionId),
      body: RTE.fromReaderEither(requireCreateSignatureRequestBody),
    }),
    RTE.bindW("dossier", ({ issuer, body }) =>
      pipe(
        issuer.id,
        getDossier(body.dossierId),
        TE.chain(
          TE.fromOption(
            () =>
              new EntityNotFoundError("The specified Dossier does not exists.")
          )
        ),
        RTE.fromTaskEither
      )
    ),
    RTE.bindW("signer", ({ body }) =>
      pipe(
        mockGetSigner(body.signerId),
        TE.chain(
          TE.fromOption(
            () =>
              new EntityNotFoundError("The specified Signer does not exists.")
          )
        ),
        RTE.fromTaskEither
      )
    ),
    RTE.map(({ issuer, dossier, signer, body: { expiresAt } }) => ({
      issuer,
      dossier,
      signer,
      expiresAt,
    }))
  );

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireCreateSignatureRequestPayload)
  );

  const encodeHttpSuccessResponse = flow(
    SignatureRequestToApiModel.encode,
    created(SignatureRequestDetailView)
  );

  return createHandler(
    decodeHttpRequest,
    flow(
      createSignatureRequest,
      TE.chainFirstW((signatureRequest) =>
        pipe(
          signatureRequest,
          createAndSendAnalyticsEvent(EventName.SIGNATURE_CREATED)
        )
      )
    ),
    error,
    encodeHttpSuccessResponse
  );
};

export const makeCreateSignatureRequestFunction = flow(
  makeCreateSignatureRequestHandler,
  azure.unsafeRun
);
