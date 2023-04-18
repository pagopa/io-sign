import { azureFunction } from "@pagopa/handler-kit-azure-func";

import { ValidateUploadHandler } from "../../http/handlers/validate-upload";

export const ValidateUploadFunction = azureFunction(ValidateUploadHandler);
