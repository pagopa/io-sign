import {
  SignatureField,
  SignatureFieldAttributes,
  SignatureFieldToBeCreatedAttributes,
} from "@io-sign/io-sign/document";

import { SignatureField as SignatureFieldApiModel } from "../models/SignatureField";
import { ExistingSignatureFieldAttrs } from "../models/ExistingSignatureFieldAttrs";
import { SignatureFieldToBeCreatedAttrs } from "../models/SignatureFieldToBeCreatedAttrs";

import { TypeEnum as ClauseTypeEnum } from "../models/Clause";

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
    // uniqueName act as discriminator between existing signature field
    // and signature fields that should be created (by coordinates)
    if ("uniqueName" in attrs) {
      return onExisting(attrs);
    }
    return onToBeCreated(attrs);
  };

export const signatureFieldToApiModel = ({
  clause,
  attributes,
}: SignatureField): SignatureFieldApiModel => ({
  clause: {
    title: clause.title,
    type: toApiModelEnum(clause.type),
  },
  attrs: matchAttributes(
    ({ uniqueName: unique_name }) => ({
      unique_name,
    }),
    ({ coordinates, size, page }) => ({
      coordinates,
      size,
      page,
    })
  )(attributes),
});
