import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { CreateSignatureRequestHandler } from "../../http/handlers/create-signature-request";

export const CreateSignatureRequestFunction = httpAzureFunction(
  CreateSignatureRequestHandler
);
