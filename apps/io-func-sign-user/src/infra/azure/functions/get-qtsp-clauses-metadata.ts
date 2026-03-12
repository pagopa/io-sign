import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { GetQtspClausesMetadataHandler } from "../../http/handlers/get-qtsp-clauses-metadata";

export const GetQtspClausesMetadataFunction = httpAzureFunction(
  GetQtspClausesMetadataHandler
);
