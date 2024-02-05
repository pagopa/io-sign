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
import { EventName, createAndSendAnalyticsEvent } from "@io-sign/io-sign/event";
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
import { DocumentsMetadataFromApiModel } from "../decoders/document";

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
                "invalid document metadata",
              ),
              E.map(O.some),
            )
          : E.right(O.none),
      }),
    ),
    RTE.fromEither,
  );

const getSigner = (signerId: Signer["id"]): TE.TaskEither<Error, Signer> =>
  pipe(
    mockGetSigner(signerId),
    TE.chain(
      TE.fromOption(
        () => new EntityNotFoundError("The specified Signer does not exists."),
      ),
    ),
  );

export const CreateSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      issuer: requireIssuer(req),
      body: requireSignatureRequestBody(req),
    }),
    RTE.bindW("dossier", ({ issuer, body }) =>
      getDossierById(body.dossierId, issuer.id),
    ),
    RTE.bindW("signer", ({ body }) =>
      pipe(getSigner(body.signerId), RTE.fromTaskEither),
    ),
    RTE.map(
      ({
        issuer,
        dossier,
        signer,
        body: { expiresAt, documentsMetadata },
      }) => ({
        issuer,
        dossier,
        signer,
        expiresAt,
        documentsMetadata,
      }),
    ),
    RTE.chainW(({ issuer, dossier, signer, expiresAt, documentsMetadata }) =>
      pipe(
        newSignatureRequest(
          dossier,
          signer,
          issuer,
          O.toUndefined(documentsMetadata),
        ),
        withExpiryDate(pipe(expiresAt, O.getOrElse(defaultExpiryDate))),
        RTE.fromEither,
      ),
    ),
    RTE.chainW(insertSignatureRequest),
    RTE.chainFirstW((request) =>
      pipe(request, createAndSendAnalyticsEvent(EventName.SIGNATURE_CREATED)),
    ),
    RTE.map(
      flow(
        SignatureRequestToApiModel.encode,
        H.successJson,
        H.withStatusCode(201),
      ),
    ),
    RTE.orElseW(logErrorAndReturnResponse),
  ),
);
