import * as E from "io-ts/lib/Encoder";

import { DocumentReady, DocumentMetadata } from "@io-sign/io-sign/document";

import { DocumentDetailView } from "../models/DocumentDetailView";
import { DocumentMetadata as DocumentMetadataApiModel } from "../models/DocumentMetadata";

import { SignatureFieldToApiModel } from "./signature-field";

export const DocumentMetadataToApiModel: E.Encoder<
  DocumentMetadataApiModel,
  DocumentMetadata
> = {
  encode: ({ title, signatureFields }) => ({
    title,
    signature_fields: signatureFields.map(SignatureFieldToApiModel.encode),
  }),
};

export const DocumentReadyToDetailView: E.Encoder<
  DocumentDetailView,
  DocumentReady
> = {
  encode: (document) => ({
    id: document.id,
    created_at: document.createdAt,
    updated_at: document.updatedAt,
    metadata: DocumentMetadataToApiModel.encode(document.metadata),
    url: document.url,
  }),
};
