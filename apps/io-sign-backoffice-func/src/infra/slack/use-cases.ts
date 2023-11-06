import { SendMessage } from "./message";

export const sendMessageToSlack =
  (message: string) =>
  ({ sendMessage }: SendMessage) =>
    sendMessage(message);
