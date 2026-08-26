import { z } from "zod";

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { webhookSchema } from "@io-sign/io-sign/webhook";

export type Webhook = z.infer<typeof webhookSchema>;
export type WebhookKey = Pick<
  {
    issuerId: z.infer<typeof webhookSchema>["issuerId"];
    institutionId: string;
  },
  "issuerId" | "institutionId"
>;
export type WebhookRepository = {
  getWebhookByKey(k: WebhookKey): Promise<Webhook | undefined>;
};

type WebhookEnvironment = {
  webhookRepository: WebhookRepository;
};

export const getWebhook = (k: WebhookKey) => (r: WebhookEnvironment) =>
  pipe(
    TE.tryCatch(
      () => r.webhookRepository.getWebhookByKey(k),
      () => new Error("Error retrieving the Webhook.")
    ),
    TE.flatMap(TE.fromNullable(new EntityNotFoundError("Webhook not found.")))
  );
