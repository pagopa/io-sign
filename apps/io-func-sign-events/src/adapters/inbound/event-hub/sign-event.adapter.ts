import {
  type EventHubTriggerConfig,
  mountAzureFunctionsEventHubTrigger
} from "@io-sign/hexagonal-azure-functions";
import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import type { SignEvent } from "../../../domain/sign-event.js";
import { SignEvent as SignEventSchema } from "../../../domain/sign-event.js";

export type SignEventUseCase = UseCase<SignEvent, void, BaseError>;

const inputMapper = (message: unknown): SignEvent => {
  const parsed = Buffer.isBuffer(message)
    ? JSON.parse(message.toString("utf-8"))
    : typeof message === "string"
      ? JSON.parse(message)
      : message;
  return SignEventSchema.parse(parsed);
};

export const mountSignEventAdapterTrigger = (
  useCaseFactory: (logger: Logger) => SignEventUseCase,
  config: EventHubTriggerConfig
): void => {
  const consumerGroup = config.consumerGroup ?? "default";
  mountAzureFunctionsEventHubTrigger({
    name: `signEventTrigger_${consumerGroup}`,
    config,
    inputMapper,
    useCaseFactory
  });
};
