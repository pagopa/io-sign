import {
  SignatureField,
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes
} from "@io-sign/io-sign/document";
import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { flow } from "fp-ts/lib/function";
import * as E from "io-ts/lib/Encoder";

import { toSignatureFieldToBeCreatedAttributes } from "../../../signature-field";
import { TypeEnum as ClauseTypeEnum } from "../models/Clause";
import { ExistingSignatureFieldAttrs } from "../models/ExistingSignatureFieldAttrs";
import { SignatureField as SignatureFieldApiModel } from "../models/SignatureField";
import { SignatureFieldToBeCreatedAttrs } from "../models/SignatureFieldToBeCreatedAttrs";

export const ClauseToApiModel: E.Encoder<
  SignatureFieldApiModel["clause"],
  SignatureField["clause"]
> = {
  encode: ({ title, type }) => ({
    title,
    type: toApiModelEnum(type)
  })
};

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

export const SignatureFieldAttributesToApiModel: E.Encoder<
  ExistingSignatureFieldAttrs,
  SignatureFieldAttributes
> = {
  encode: ({ uniqueName: unique_name }) => ({ unique_name })
};

export const SignatureFieldToBeCreatedAttributesToApiModel = (
  pageHeight: NonNegativeNumber
): E.Encoder<
  SignatureFieldToBeCreatedAttrs,
  SignatureFieldToBeCreatedAttributes
> => ({
  encode: flow(
    toSignatureFieldToBeCreatedAttributes(pageHeight),
    ({ bottomLeft: bottom_left, topRight: top_right, page }) => ({
      bottom_left,
      top_right,
      page
    })
  )
});
