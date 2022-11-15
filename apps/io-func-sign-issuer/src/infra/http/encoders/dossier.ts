import * as E from "io-ts/lib/Encoder";
import { Dossier } from "../../../dossier";

import { DossierDetailView } from "../models/DossierDetailView";
import { DocumentMetadataToApiModel } from "./document";

export const DossierToApiModel: E.Encoder<DossierDetailView, Dossier> = {
  encode: ({
    id,
    title,
    createdAt: created_at,
    updatedAt: updated_at,
    documentsMetadata,
  }) => ({
    id,
    title,
    created_at,
    updated_at,
    documents_metadata: documentsMetadata.map(
      DocumentMetadataToApiModel.encode
    ),
  }),
};
