import * as H from "@pagopa/handler-kit";
import * as O from "fp-ts/lib/Option";
import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { requireIssuer } from "../../http/decoders/issuer";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { CreateSignatureRequestBody } from "../../http/models/CreateSignatureRequestBody";
import * as E from "fp-ts/lib/Either";
import { getDossierById } from "../../../dossier";
import { mockGetSigner } from "../../__mocks__/signer";
import * as TE from "fp-ts/lib/TaskEither";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import {
  SignatureRequest,
  SignatureRequestEnvironment,
  defaultExpiryDate,
  newSignatureRequest,
  withExpiryDate,
} from "../../../signature-request";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { SignatureRequestToApiModel } from "../encoders/signature-request";

export const insertSignatureRequest =
  (
    s: SignatureRequest
  ): RTE.ReaderTaskEither<
    SignatureRequestEnvironment,
    Error,
    SignatureRequest
  > =>
  ({ signatureRequestRepository: repo }) =>
    repo.upsert(s); // TODO: upsert? in insertDossier c'è insert

export const CreateSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      issuer: requireIssuer(req),
      body: pipe(
        req.body,
        H.parse(CreateSignatureRequestBody),
        E.map((body) => ({
          dossierId: body.dossier_id,
          signerId: body.signer_id,
          expiresAt: O.fromNullable(body.expires_at),
        })),
        RTE.fromEither
      ),
    }),
    RTE.bindW("dossier", ({ issuer, body }) =>
      pipe(getDossierById(body.dossierId, issuer.id))
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
    })),
    RTE.map(({ issuer, dossier, signer, expiresAt }) =>
      pipe(
        newSignatureRequest(dossier, signer, issuer)
        // withExpiryDate(pipe(expiresAt, O.getOrElse(defaultExpiryDate)))
      )
    ),
    RTE.chainW(insertSignatureRequest),
    RTE.map(
      flow(
        SignatureRequestToApiModel.encode,
        H.successJson,
        H.withStatusCode(201)
      )
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
