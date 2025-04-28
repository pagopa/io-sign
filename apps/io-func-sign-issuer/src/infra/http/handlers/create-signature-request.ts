import { EventName, createAndSendAnalyticsEvent } from "@io-sign/io-sign/event";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import * as H from "@pagopa/handler-kit";
import { sequenceS } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { getDossierById } from "../../../dossier";
import {
  defaultExpiryDate,
  newSignatureRequest,
  withExpiryDate
} from "../../../signature-request";
import { insertSignatureRequest } from "../../../signature-request";
import { requireIssuer } from "../../http/decoders/issuer";
import { CreateSignatureRequestBody } from "../../http/models/CreateSignatureRequestBody";
import { DocumentsMetadataFromApiModel } from "../decoders/document";
import { SignatureRequestToApiModel } from "../encoders/signature-request";

const requireSignatureRequestBody = (req: H.HttpRequest) =>
  pipe(
    req.body,
    H.parse(CreateSignatureRequestBody),
    E.chain(({ dossier_id, signer_id, expires_at, documents_metadata }) =>
      sequenceS(E.Apply)({
        dossierId: E.right(dossier_id),
        signerId: E.right(signer_id),
        expiresAt: pipe(expires_at, O.fromNullable, E.of),
        documentsMetadata: documents_metadata
          ? pipe(
              documents_metadata,
              H.parse(
                DocumentsMetadataFromApiModel,
                "invalid document metadata"
              ),
              E.map(O.some)
            )
          : E.right(O.none)
      })
    ),
    RTE.fromEither
  );

export const CreateSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      issuer: requireIssuer(req),
      body: requireSignatureRequestBody(req)
    }),
    RTE.bindW("dossier", ({ issuer, body }) =>
      getDossierById(body.dossierId, issuer.id)
    ),
    RTE.map(
      ({
        issuer,
        dossier,
        body: { expiresAt, documentsMetadata, signerId }
      }) => ({
        issuer,
        dossier,
        signer: { id: signerId },
        expiresAt,
        documentsMetadata
      })
    ),
    RTE.chainW(({ issuer, dossier, signer, expiresAt, documentsMetadata }) =>
      pipe(
        newSignatureRequest(
          dossier,
          signer,
          issuer,
          O.toUndefined(documentsMetadata)
        ),
        withExpiryDate(pipe(expiresAt, O.getOrElse(defaultExpiryDate))),
        RTE.fromEither
      )
    ),
    RTE.chainW(insertSignatureRequest),
    RTE.chainFirstW((request) =>
      pipe(request, createAndSendAnalyticsEvent(EventName.SIGNATURE_CREATED))
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
