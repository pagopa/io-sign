import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { SetSignatureRequestExpiresAtHandler } from "../../http/handlers/set-signature-request-expires-at";

export const SetSignatureRequestExpiresAtFunction = httpAzureFunction(
  SetSignatureRequestExpiresAtHandler
);
