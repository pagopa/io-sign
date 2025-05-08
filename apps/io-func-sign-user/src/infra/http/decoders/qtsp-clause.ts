import { validate } from "@io-sign/io-sign/validation";
import { sequenceS } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import { HttpRequest } from "handler-kit-legacy/lib/http";
import * as t from "io-ts";
import * as tx from "io-ts-types";

import { QtspClause } from "../../../qtsp";
import { QtspClauseToApiModel } from "../encoders/qtsp-clause";
import { CreateSignatureBody } from "../models/CreateSignatureBody";
import { QtspClause as QtspClauseApiModel } from "../models/QtspClause";

export const QtspClauseFromApiModel = new t.Type<
  QtspClause,
  QtspClauseApiModel,
  QtspClauseApiModel
>(
  "QtspClauseFromApiModel",
  QtspClause.is,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ text }, _ctx) => E.right({ text }),
  QtspClauseToApiModel.encode
);

export const requireQtspClauses = flow(
  (res: HttpRequest) => res.body,
  validate(CreateSignatureBody),
  E.map((body) => body.qtsp_clauses),
  (qtspClauses) =>
    sequenceS(E.Apply)({
      acceptedClauses: pipe(
        qtspClauses,
        E.map((qtspClauses) => qtspClauses.accepted_clauses),
        E.chain(
          validate(
            tx.nonEmptyArray(QtspClause),
            "Invalid qtsp accepted clauses"
          )
        )
      ),
      qtspClauses
    }),
  E.map(({ acceptedClauses, qtspClauses }) => ({
    acceptedClauses,
    filledDocumentUrl: qtspClauses.filled_document_url,
    nonce: qtspClauses.nonce
  }))
);
