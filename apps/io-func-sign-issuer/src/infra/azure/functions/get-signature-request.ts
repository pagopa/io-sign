import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { GetSignatureRequestHandler } from "../../http/handlers/get-signature-request";

export const GetSignatureRequestFunction = httpAzureFunction(
  GetSignatureRequestHandler
);
