import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { SetSignatureRequestStatusHandler } from "../../http/handlers/set-signature-request-status";

export const SetSignatureRequestStatusFunction = httpAzureFunction(
  SetSignatureRequestStatusHandler,
);
