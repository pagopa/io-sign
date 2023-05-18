import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { CreateDossierHandler } from "../../http/handlers/create-dossier";

export const CreateDossierFunction = httpAzureFunction(CreateDossierHandler);
