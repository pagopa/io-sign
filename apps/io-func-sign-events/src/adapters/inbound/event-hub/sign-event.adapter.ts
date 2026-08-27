import {
  type EventHubTriggerConfig,
  mountAzureFunctionsEventHubTrigger
} from "@io-sign/hexagonal-azure-functions";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import type { SignEvent } from "../../../domain/sign-event.js";
import { SignEvent as SignEventSchema } from "../../../domain/sign-event.js";
import type { SignEventUseCase } from "../../../application/contracts/sign-event.js";

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
