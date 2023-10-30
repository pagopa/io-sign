import { pipe } from "fp-ts/lib/function";
import { SlackEnvironment } from "./channel";

export const sendMessageToSlack =
  (message: string) =>
  ({ slackRepository }: SlackEnvironment) =>
    pipe(message, slackRepository.sendMessage.bind(slackRepository));
