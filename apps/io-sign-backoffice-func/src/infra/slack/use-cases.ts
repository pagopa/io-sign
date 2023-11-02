import { SlackEnvironment } from "./message";

export const sendMessageToSlack =
  (message: string) =>
  ({ slackRepository }: SlackEnvironment) =>
    slackRepository.sendMessage(message);
