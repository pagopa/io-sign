import { azureFunction } from "@pagopa/handler-kit-azure-func";
import { CancelSignatureRequestHandler } from "../../handlers/cancel-signature-request";

export const CancelSignatureRequestFunction = azureFunction(
  CancelSignatureRequestHandler
);
