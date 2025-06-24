import * as E from "io-ts/lib/Encoder";

import { QtspClause } from "../../../qtsp";
import { QtspClause as QtspClauseApiModel } from "../models/QtspClause";

export const QtspClauseToApiModel: E.Encoder<QtspClauseApiModel, QtspClause> = {
  encode: ({ text }) => ({
    text
  })
};
