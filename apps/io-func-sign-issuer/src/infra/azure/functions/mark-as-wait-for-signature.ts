import { azureFunction } from "@pagopa/handler-kit-azure-func";
import { MarkAsWaitForSignatureHandler } from "../../handlers/mark-as-wait-for-signature";

export const MarkAsWaitForSignatureFunction = azureFunction(
  MarkAsWaitForSignatureHandler
);
