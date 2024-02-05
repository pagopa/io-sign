import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { GetSignatureRequestsHandler } from "../../http/handlers/get-signature-requests";

export const GetSignatureRequestsFunction = httpAzureFunction(
  GetSignatureRequestsHandler
);
