import * as H from "@pagopa/handler-kit";

import { Dossier } from "../../../dossier";

import { pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/lib/Record";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

export const requireDossierId = (req: H.HttpRequest) =>
  pipe(
    req.path,
    lookup("dossierId"),
    RTE.fromOption(() => new Error(`Missing "id" in path.`)),
    RTE.chainEitherKW(H.parse(Dossier.props.id, `Invalid "id" supplied.`))
  );
