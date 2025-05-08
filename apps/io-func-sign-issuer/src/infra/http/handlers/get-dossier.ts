import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import * as H from "@pagopa/handler-kit";
import { sequenceS } from "fp-ts/lib/Apply";
import { ApplyPar, chainW, map, orElseW } from "fp-ts/lib/ReaderTaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { getDossierById } from "../../../dossier";
import { requireDossierId } from "../decoders/dossier";
import { requireIssuer } from "../decoders/issuer";
import { DossierToApiModel } from "../encoders/dossier";

export const GetDossierHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(ApplyPar)({
      id: requireDossierId(req),
      issuer: requireIssuer(req)
    }),
    chainW(({ id, issuer }) => getDossierById(id, issuer.id)),
    map(flow(DossierToApiModel.encode, H.successJson)),
    orElseW(logErrorAndReturnResponse)
  )
);
