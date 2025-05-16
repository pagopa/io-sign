import * as H from "@pagopa/handler-kit";

import { ApplyPar, chainW, map, orElseW } from "fp-ts/lib/ReaderTaskEither";

import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { requireIssuer } from "../decoders/issuer";

import { getDossierById } from "../../../dossier";
import { requireDossierId } from "../decoders/dossier";
import { DossierToApiModel } from "../encoders/dossier";

export const GetDossierHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(ApplyPar)({
      id: requireDossierId(req),
      issuer: requireIssuer(req),
    }),
    chainW(({ id, issuer }) => getDossierById(id, issuer.id)),
    map(flow(DossierToApiModel.encode, H.successJson)),
    orElseW(logErrorAndReturnResponse)
  )
);
