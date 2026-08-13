import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { GetMetadataHandler } from "../../http/handlers/get-metadata";

export const GetMetadataFunction = httpAzureFunction(GetMetadataHandler);
