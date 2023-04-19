import * as H from "@pagopa/handler-kit";

import * as E from "fp-ts/lib/Either";

import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import {
  ApplyPar,
  fromEither,
  map,
  chainW,
  orElseW,
} from "fp-ts/ReaderTaskEither";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { requireIssuer } from "../decoders/issuer";
import { CreateDossierBody } from "../models/CreateDossierBody";
import { Dossier, insertDossier, newDossier } from "../../../dossier";

import { DocumentsMetadataFromApiModel } from "../decoders/document";
import { DossierToApiModel } from "../encoders/dossier";

const requireDossierBody = (req: H.HttpRequest) =>
  pipe(
    req.body,
    H.parse(CreateDossierBody),
    E.chain((body) =>
      sequenceS(E.Apply)({
        title: pipe(body.title, H.parse(Dossier.props.title)),
        documentsMetadata: pipe(
          body.documents_metadata,
          H.parse(DocumentsMetadataFromApiModel, "invalid document metadata")
        ),
      })
    ),
    fromEither
  );

export const CreateDossierHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(ApplyPar)({
      issuer: requireIssuer(req),
      body: requireDossierBody(req),
    }),
    map(({ issuer, body: { title, documentsMetadata } }) =>
      newDossier(issuer, title, documentsMetadata)
    ),
    chainW(insertDossier),
    map(flow(DossierToApiModel.encode, H.successJson, H.withStatusCode(201))),
    orElseW(logErrorAndReturnResponse)
  )
);
