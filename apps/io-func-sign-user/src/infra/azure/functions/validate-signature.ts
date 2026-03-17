import { azureFunction } from "@pagopa/handler-kit-azure-func";

import { ValidateSignatureHandler } from "../../handlers/validate-signature";

export const ValidateSignatureFunction = azureFunction(
  ValidateSignatureHandler
);
