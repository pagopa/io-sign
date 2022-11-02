import { body } from "@pagopa/handler-kit/lib/http";
import { validate } from "@pagopa/handler-kit/lib/validation";

import { flow } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";

import { CreateDossierBody } from "../models/CreateDossierBody";
import { DocumentsMetadata } from "../../../dossier";

export const requireDocumentsMetadata = flow(
  body(CreateDossierBody),
  E.map((body) => body.documents_metadata),
  E.chainW(
    validate(
      // here we have to validate "documents_metadata"
      // against "DocumentsMetadata" because the types
      // are incompatible due the check of non emptiness
      DocumentsMetadata,
      "documents_metadata must not be empty"
    )
  )
);
