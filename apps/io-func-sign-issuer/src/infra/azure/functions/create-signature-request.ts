import {
  CreateSignatureRequestPayload,
  makeCreateSignatureRequest,
} from "../../../app/use-cases/create-signature-request";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as O from "fp-ts/lib/Option";

import {
  HttpRequest,
  body,
  created,
  error,
} from "@pagopa/handler-kit/lib/http";
import { sequenceS } from "fp-ts/lib/Apply";

import { pipe, flow } from "fp-ts/lib/function";
import { makeRequireIssuer } from "../../http/decoders/issuer";
import { CreateSignatureRequestBody } from "../../http/models/CreateSignatureRequestBody";
import { SignatureRequest } from "../../../signature-request";
import { makeGetDossier } from "../cosmos/dossier";

import { dossierNotFoundError } from "../../../dossier";
import { GetSigner, signerNotFoundError } from "@internal/io-sign/signer";
import * as azure from "@pagopa/handler-kit/lib/azure";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { SignatureRequestDetailView } from "../../http/models/SignatureRequestDetailView";
import { createHandler } from "@pagopa/handler-kit";

import type { Database as CosmosDatabase } from "@azure/cosmos";

import { makeInsertSignatureRequest } from "../cosmos/signature-request";
import { mockGetSigner } from "../../__mocks__/signer";
import { mockGetIssuerBySubscriptionId } from "../../__mocks__/issuer";

const makeCreateSignatureRequestHandler = (db: CosmosDatabase) => {
  const getDossier = makeGetDossier(db);

  const insertSignatureRequest = makeInsertSignatureRequest(db);

  const createSignatureRequest = makeCreateSignatureRequest(
    insertSignatureRequest
  );

  const requireCreateSignatureRequestBody = flow(
    body(CreateSignatureRequestBody),
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
      issuer: makeRequireIssuer(mockGetIssuerBySubscriptionId),
      body: RTE.fromReaderEither(requireCreateSignatureRequestBody),
    }),
    RTE.bindW("dossier", ({ issuer, body }) =>
      pipe(
        issuer.id,
        getDossier(body.dossierId),
        TE.chain(TE.fromOption(() => dossierNotFoundError)),
        RTE.fromTaskEither
      )
    ),
    RTE.bindW("signer", ({ body }) =>
      pipe(
        mockGetSigner(body.signerId),
        TE.chain(TE.fromOption(() => signerNotFoundError)),
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
    createSignatureRequest,
    error,
    encodeHttpSuccessResponse
  );
};

export const makeCreateSignatureRequestAzureFunction = flow(
  makeCreateSignatureRequestHandler,
  azure.unsafeRun
);
