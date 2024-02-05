import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as E from "io-ts/lib/Encoder";

import { option } from "fp-ts";
import { SignatureFieldAttributes } from "@io-sign/io-sign/document";
import { QtspCreateSignaturePayload, QtspDocumentToSign } from "../../../qtsp";

import {
  CreateSignatureRequestBody as CreateSignatureRequestApiModel,
  DocumentToSign as DocumentToSignApiModel,
  SignatureCoordinate as SignatureCoordinateApiModel,
} from "../signature-request";
import {
  SignatureField,
  SignatureFieldToBeCreatedAttributes,
} from "../../../signature-field";

const SignatureFieldToBeCreatedToApiModel: E.Encoder<
  SignatureCoordinateApiModel,
  SignatureFieldToBeCreatedAttributes
> = {
  encode: ({ bottomLeft, topRight, page }) => ({
    page,
    position: [bottomLeft.x, bottomLeft.y, topRight.x, topRight.y],
  }),
};

const mapToBeCreatedAttributes = (signatureField: SignatureField) =>
  pipe(
    signatureField.attributes,
    SignatureFieldToBeCreatedAttributes.decode,
    option.fromEither,
  );

const mapAttributes = (signatureField: SignatureField) =>
  pipe(
    signatureField.attributes,
    SignatureFieldAttributes.decode,
    option.fromEither,
  );

const QtspDocumentToSignToApiModel: E.Encoder<
  DocumentToSignApiModel,
  QtspDocumentToSign
> = {
  encode: ({ urlIn, urlOut, signatureFields }) => ({
    url_in: urlIn,
    url_out: urlOut,
    signature_fields: pipe(
      signatureFields,
      A.filterMap(mapAttributes),
      A.map((el) => el.uniqueName),
    ),
    signature_coordinates: pipe(
      signatureFields,
      A.filterMap(mapToBeCreatedAttributes),
      A.map(SignatureFieldToBeCreatedToApiModel.encode),
    ),
    signatures_type: "PADES-LT",
    appearance_alias: "appio",
  }),
};

export const QtspCreateSignatureToApiModel: E.Encoder<
  CreateSignatureRequestApiModel,
  QtspCreateSignaturePayload
> = {
  encode: ({
    fiscalCode,
    publicKey,
    spidAssertion,
    email,
    documentLink,
    nonce,
    tosSignature,
    signature,
    documentsToSign,
    signatureInput,
  }) => ({
    fiscal_code: fiscalCode,
    public_key: publicKey,
    SAML_assertion: spidAssertion,
    email,
    document_link: documentLink,
    nonce,
    tos_signature: tosSignature,
    signatures: {
      signed_challenge: signature,
      signatures_type: "PADES",
      documents_to_sign: documentsToSign.map(
        QtspDocumentToSignToApiModel.encode,
      ),
    },
    signature_input: signatureInput,
  }),
};
