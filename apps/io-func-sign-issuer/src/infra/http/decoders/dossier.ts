import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { lookup } from "fp-ts/lib/Record";
import { pipe } from "fp-ts/lib/function";

import { Dossier } from "../../../dossier";

export const requireDossierId = (req: H.HttpRequest) =>
  pipe(
    req.path,
    lookup("dossierId"),
    RTE.fromOption(() => new Error(`Missing "id" in path.`)),
    RTE.chainEitherKW(H.parse(Dossier.props.id, `Invalid "id" supplied.`))
  );
