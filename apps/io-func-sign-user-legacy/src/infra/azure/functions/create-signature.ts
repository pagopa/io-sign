import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { CreateSignatureHandler } from "../../http/handlers/create-signature";

export const CreateSignatureFunction = httpAzureFunction(
  CreateSignatureHandler
);
