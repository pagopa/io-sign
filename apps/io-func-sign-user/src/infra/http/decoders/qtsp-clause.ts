import { validate } from "@io-sign/io-sign/validation";
import { HttpRequest } from "handler-kit-legacy/lib/http";

import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as tx from "io-ts-types";
import * as t from "io-ts";

import { sequenceS } from "fp-ts/lib/Apply";
import { QtspClause as QtspClauseApiModel } from "../models/QtspClause";
import { CreateSignatureBody } from "../models/CreateSignatureBody";
import { QtspClause } from "../../../qtsp";
import { QtspClauseToApiModel } from "../encoders/qtsp-clause";

export const QtspClauseFromApiModel = new t.Type<
  QtspClause,
  QtspClauseApiModel,
  QtspClauseApiModel
>(
  "QtspClauseFromApiModel",
  QtspClause.is,
  ({ text }, _ctx) => E.right({ text }),
  QtspClauseToApiModel.encode,
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
            "Invalid qtsp accepted clauses",
          ),
        ),
      ),
      qtspClauses,
    }),
  E.map(({ acceptedClauses, qtspClauses }) => ({
    acceptedClauses,
    filledDocumentUrl: qtspClauses.filled_document_url,
    nonce: qtspClauses.nonce,
  })),
);
