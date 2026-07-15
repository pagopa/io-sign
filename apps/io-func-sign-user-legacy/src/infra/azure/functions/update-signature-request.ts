import { azureFunction } from "@pagopa/handler-kit-azure-func";
import { UpdateSignatureRequestHandler } from "../../handlers/update-signature-request";

export const UpdateSignatureRequestFunction = azureFunction(
  UpdateSignatureRequestHandler
);
