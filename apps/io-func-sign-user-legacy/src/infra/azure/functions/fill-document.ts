import { azureFunction } from "@pagopa/handler-kit-azure-func";

import { FillDocumentHandler } from "../../handlers/fill-document";

export const FillDocumentFunction = azureFunction(FillDocumentHandler);
