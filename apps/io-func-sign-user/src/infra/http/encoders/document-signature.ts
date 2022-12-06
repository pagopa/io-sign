import * as E from "io-ts/lib/Encoder";
import { DocumentToSign } from "../../../document-to-sign";

import { DocumentToSign as DocumentToSignApiModel } from "../models/DocumentToSign";

import { SignatureFieldToApiModel } from "./signature-field";

export const DocumentToSignToApiModel: E.Encoder<
  DocumentToSignApiModel,
  DocumentToSign
> = {
  encode: ({ documentId, signatureFields }) => ({
    document_id: documentId,
    signature_fields: signatureFields.map(SignatureFieldToApiModel.encode),
  }),
};
