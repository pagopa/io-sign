import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { SendOutcomeNotificationHandler } from "../../http/handlers/send-outcome-notification";

export const SendOutcomeNotificationFunction = httpAzureFunction(
  SendOutcomeNotificationHandler
);
