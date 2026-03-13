import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { GetSignerHandler } from "../../http/handlers/get-signer";

export const GetSignerFunction = httpAzureFunction(GetSignerHandler);
