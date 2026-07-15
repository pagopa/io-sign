import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { GetThirdPartyMessageDetailsHandler } from "../../http/handlers/get-third-party-message-details";

export const GetThirdPartyMessageDetailsFunction = httpAzureFunction(
  GetThirdPartyMessageDetailsHandler
);
