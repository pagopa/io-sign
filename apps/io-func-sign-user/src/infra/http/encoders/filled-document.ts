import * as E from "io-ts/lib/Encoder";
import { FilledDocument } from "../../../filled-document";

import { FilledDocumentDetailView } from "../models/FilledDocumentDetailView";

export const FilledDocumentToApiModel: E.Encoder<
  FilledDocumentDetailView,
  FilledDocument
> = {
  encode: ({ url: filled_document_url }) => ({
    filled_document_url: filled_document_url.href,
  }),
};
