import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { GetDossierHandler } from "../../http/handlers/get-dossier";

export const GetDossierFunction = httpAzureFunction(GetDossierHandler);
