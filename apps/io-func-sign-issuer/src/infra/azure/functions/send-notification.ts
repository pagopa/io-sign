import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { SendNotificationHandler } from "../../http/handlers/send-notification";

export const SendNotificationFunction = httpAzureFunction(
  SendNotificationHandler
);
