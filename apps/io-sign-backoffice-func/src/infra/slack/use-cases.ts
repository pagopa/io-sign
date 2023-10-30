import { pipe } from "fp-ts/lib/function";
import { SlackEnvironment } from "./message";

export const sendMessageToSlack =
  (message: string) =>
  ({ slackRepository }: SlackEnvironment) =>
    pipe(message, slackRepository.sendMessage.bind(slackRepository));
