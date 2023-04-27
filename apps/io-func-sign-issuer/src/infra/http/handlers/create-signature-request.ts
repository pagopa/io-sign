import * as H from "@pagopa/handler-kit";
import * as O from "fp-ts/lib/Option";
import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { Signer } from "@io-sign/io-sign/signer";
import { requireIssuer } from "../../http/decoders/issuer";
import { CreateSignatureRequestBody } from "../../http/models/CreateSignatureRequestBody";
import { getDossierById } from "../../../dossier";
import { mockGetSigner } from "../../__mocks__/signer";
import {
  defaultExpiryDate,
  newSignatureRequest,
  withExpiryDate,
} from "../../../signature-request";
import { SignatureRequestToApiModel } from "../encoders/signature-request";
import { insertSignatureRequest } from "../../../signature-request";
import { EventName, createAndSendAnalyticsEvent } from "@io-sign/io-sign/event";

const requireSignatureRequestBody = (req: H.HttpRequest) =>
  pipe(
    req.body,
    H.parse(CreateSignatureRequestBody),
    E.map((body) => ({
      dossierId: body.dossier_id,
      signerId: body.signer_id,
      expiresAt: O.fromNullable(body.expires_at),
    })),
    RTE.fromEither
  );

const getSigner = (signerId: Signer["id"]): TE.TaskEither<Error, Signer> =>
  pipe(
    mockGetSigner(signerId),
    TE.chain(
      TE.fromOption(
        () => new EntityNotFoundError("The specified Signer does not exists.")
      )
    )
  );

export const CreateSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      issuer: requireIssuer(req),
      body: requireSignatureRequestBody(req),
    }),
    RTE.bindW("dossier", ({ issuer, body }) =>
      getDossierById(body.dossierId, issuer.id)
    ),
    RTE.bindW("signer", ({ body }) =>
      pipe(getSigner(body.signerId), RTE.fromTaskEither)
    ),
    RTE.map(({ issuer, dossier, signer, body: { expiresAt } }) => ({
      issuer,
      dossier,
      signer,
      expiresAt,
    })),
    RTE.chainW(({ issuer, dossier, signer, expiresAt }) =>
      pipe(
        newSignatureRequest(dossier, signer, issuer),
        withExpiryDate(pipe(expiresAt, O.getOrElse(defaultExpiryDate))),
        RTE.fromEither
      )
    ),
    RTE.chainW(insertSignatureRequest),
    RTE.chainFirstW((request) =>
      pipe(EventName.SIGNATURE_CREATED, createAndSendAnalyticsEvent(request))
    ),
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
