import * as E from "io-ts/lib/Encoder";

import {
  DocumentMetadata,
  DocumentReady,
  SignatureFieldAttributes
} from "@io-sign/io-sign/document";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { DocumentDetailView } from "../models/DocumentDetailView";
import { DocumentMetadata as DocumentMetadataApiModel } from "../models/DocumentMetadata";

import { SignatureField } from "../models/SignatureField";
import {
  ClauseToApiModel,
  SignatureFieldAttributesToApiModel,
  SignatureFieldToBeCreatedAttributesToApiModel
} from "./signature-field";

export const DocumentMetadataToApiModel: E.Encoder<
  DocumentMetadataApiModel,
  DocumentMetadata
> = {
  encode: ({ title, signatureFields, pdfDocumentMetadata }) => {
    const fields: Array<SignatureField> = [];
    const heights = new Map<NonNegativeNumber, NonNegativeNumber>(
      pdfDocumentMetadata.pages.map((p) => [p.number, p.height])
    );
    for (const field of signatureFields) {
      const clause = ClauseToApiModel.encode(field.clause);
      if (SignatureFieldAttributes.is(field.attributes)) {
        fields.push({
          clause,
          attrs: SignatureFieldAttributesToApiModel.encode(field.attributes)
        });
      } else if (heights.has(field.attributes.page)) {
        const pageHeight = heights.get(field.attributes.page);
        if (pageHeight) {
          fields.push({
            clause,
            attrs: SignatureFieldToBeCreatedAttributesToApiModel(
              pageHeight
            ).encode(field.attributes)
          });
        }
      }
    }
    return {
      title,
      // removes all signature fields from DocumentMetadata if they reference to non-existent document page
      signature_fields: signatureFields.length === fields.length ? fields : []
    };
  }
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
    url: document.url
  })
};
