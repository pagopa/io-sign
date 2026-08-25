import {
  type EventHubTriggerConfig,
  mountAzureFunctionsEventHubTrigger
} from "@io-sign/hexagonal-azure-functions";
import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import type { SignEvent } from "../../../domain/sign-event.js";

export type ProcessSignEventUseCase = UseCase<SignEvent, void, BaseError>;

const inputMapper = (message: unknown): SignEvent => {
  const raw = Buffer.isBuffer(message)
    ? message.toString("utf-8")
    : typeof message === "string"
      ? message
      : JSON.stringify(message);
  return JSON.parse(raw) as SignEvent;
};

export const mountSignEventTrigger = (
  useCaseFactory: (logger: Logger) => ProcessSignEventUseCase,
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
