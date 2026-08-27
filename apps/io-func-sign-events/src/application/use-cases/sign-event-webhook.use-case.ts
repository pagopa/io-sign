import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { ok } from "neverthrow";
import type { SignEvent } from "../../domain/sign-event.js";

type SignEventWebhookDeps = { logger: Logger };

export const makeSignEventWebhookUseCase =
  ({ logger }: SignEventWebhookDeps): UseCase<SignEvent, void, BaseError> =>
  async (event) => {
    logger.info("sign event received by trigger for webhook", {
      eventName: event.eventName,
      payloadType: event.payloadType,
      payload: JSON.stringify(event.payload, null, 2)
    });
    return ok(undefined);
  };
