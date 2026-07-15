import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { GetSignerByFiscalCodeHandler } from "../../http/handlers/get-signer-by-fiscal-code";

export const GetSignerByFiscalCodeFunction = httpAzureFunction(
  GetSignerByFiscalCodeHandler
);
