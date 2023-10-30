import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { isSuccessful } from "@io-sign/io-sign/infra/client-utils";

export type SlackRepository = {
  sendMessage: (message: string) => TE.TaskEither<Error, void>;
};

export type SlackEnvironment = {
  slackRepository: SlackRepository;
};

export class SlackChannelRepository implements SlackRepository {
  #webhookUrl: string;

  constructor(webhookUrl: string) {
    this.#webhookUrl = webhookUrl;
  }

  sendMessage(text: string): TE.TaskEither<Error, void> {
    return pipe(
      TE.tryCatch(
        () =>
          fetch(this.#webhookUrl, {
            method: "POST",
            body: JSON.stringify({
              text,
            }),
          }),
        E.toError
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to post message on slack failed.")
      ),
      TE.map(() => undefined)
    );
  }
}
