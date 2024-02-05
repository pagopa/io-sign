import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { GetRequestsByDossierHandler } from "../../http/handlers/get-requests-by-dossier";

export const GetRequestsByDossierFunction = httpAzureFunction(
  GetRequestsByDossierHandler,
);
