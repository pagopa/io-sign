import * as E from "io-ts/lib/Encoder";

import {
  DocumentReady,
  DocumentMetadata,
  SignatureFieldAttributes,
} from "@io-sign/io-sign/document";

import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import { DocumentDetailView } from "../models/DocumentDetailView";
import { DocumentMetadata as DocumentMetadataApiModel } from "../models/DocumentMetadata";

import { SignatureField } from "../models/SignatureField";
import {
  ClauseToApiModel,
  SignatureFieldAttributesToApiModel,
  SignatureFieldToBeCreatedAttributesToApiModel,
} from "./signature-field";

export const DocumentMetadataToApiModel: E.Encoder<
  DocumentMetadataApiModel,
  DocumentMetadata
> = {
  encode: ({ title, signatureFields, pdfDocumentMetadata }) => {
    const fields: SignatureField[] = [];
    const heights = new Map<NonNegativeNumber, NonNegativeNumber>(
      pdfDocumentMetadata.pages.map((p) => [p.number, p.height])
    );
    for (const field of signatureFields) {
      const clause = ClauseToApiModel.encode(field.clause);
      if (SignatureFieldAttributes.is(field.attributes)) {
        // eslint-disable-next-line functional/immutable-data
        fields.push({
          clause,
          attrs: SignatureFieldAttributesToApiModel.encode(field.attributes),
        });
      } else if (heights.has(field.attributes.page)) {
        const pageHeight = heights.get(field.attributes.page);
        if (pageHeight) {
          // eslint-disable-next-line functional/immutable-data
          fields.push({
            clause,
            attrs: SignatureFieldToBeCreatedAttributesToApiModel(
              pageHeight
            ).encode(field.attributes),
          });
        }
      }
    }
    return {
      title,
      // removes all signature fields from DocumentMetadata if they reference to non-existent document page
      signature_fields: signatureFields.length === fields.length ? fields : [],
    };
  },
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
