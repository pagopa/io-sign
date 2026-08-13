import { azureFunction } from "@pagopa/handler-kit-azure-func";

import { CreateSignatureRequestHandler } from "../../handlers/create-signature-request";

export const CreateSignatureRequestFunction = azureFunction(
  CreateSignatureRequestHandler
);
