import {
  SignatureFieldAttributes,
  SignatureField,
  SignatureFieldToBeCreatedAttributes,
} from "@io-sign/io-sign/document";

import * as E from "io-ts/lib/Encoder";
import { flow } from "fp-ts/lib/function";
import { SignatureField as SignatureFieldApiModel } from "../models/SignatureField";
import { ExistingSignatureFieldAttrs } from "../models/ExistingSignatureFieldAttrs";
import { SignatureFieldToBeCreatedAttrs } from "../models/SignatureFieldToBeCreatedAttrs";

import { TypeEnum as ClauseTypeEnum } from "../models/Clause";

import { toSignatureFieldToBeCreatedAttributes } from "../../../signature-field";

const toApiModelEnum = (
  type: SignatureField["clause"]["type"]
): ClauseTypeEnum => {
  switch (type) {
    case "OPTIONAL":
      return ClauseTypeEnum.OPTIONAL;
    case "REQUIRED":
      return ClauseTypeEnum.REQUIRED;
    case "UNFAIR":
      return ClauseTypeEnum.UNFAIR;
  }
};

const matchAttributes =
  (
    onExisting: (a: SignatureFieldAttributes) => ExistingSignatureFieldAttrs,
    onToBeCreated: (
      b: SignatureFieldToBeCreatedAttributes
    ) => SignatureFieldToBeCreatedAttrs
  ) =>
  (attrs: SignatureField["attributes"]): SignatureFieldApiModel["attrs"] => {
    if ("uniqueName" in attrs) {
      return onExisting(attrs);
    }
    return onToBeCreated(attrs);
  };

export const SignatureFieldToApiModel: E.Encoder<
  SignatureFieldApiModel,
  SignatureField
> = {
  encode: ({ clause, attributes }) => ({
    clause: {
      title: clause.title,
      type: toApiModelEnum(clause.type),
    },
    attrs: matchAttributes(
      ({ uniqueName: unique_name }) => ({
        unique_name,
      }),
      flow(
        toSignatureFieldToBeCreatedAttributes,
        ({ bottomLeft: bottom_left, topRight: top_right, page }) => ({
          bottom_left,
          top_right,
          page,
        })
      )
    )(attributes),
  }),
};
