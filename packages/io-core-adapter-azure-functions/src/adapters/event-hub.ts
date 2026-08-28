import { app as azureApp } from "@azure/functions";
import type { InvocationContext } from "@azure/functions";
import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { makeInvocationContextLogger } from "./invocation-context-logger.js";

export type EventHubTriggerConfig = {
  connection: string;
  eventHubName: string;
  consumerGroup?: string;
};

/**
 * Registers an Azure Functions EventHub trigger from a use case.
 *
 * Mirrors mountAzureFunctionsRoute but targets azureApp.eventHub() — messages
 * are processed in batch (cardinality: "many"); individual failures are logged
 * without poisoning the whole batch.
 */
export const mountAzureFunctionsEventHubTrigger = <
  Input extends object,
  E extends BaseError
>(spec: {
  name: string;
  config: EventHubTriggerConfig;
  inputMapper: (message: unknown) => Input;
  useCaseFactory: (logger: Logger) => UseCase<Input, void, E>;
}): void => {
  const { name, config, inputMapper, useCaseFactory } = spec;

  azureApp.eventHub(name, {
    connection: config.connection,
    eventHubName: config.eventHubName,
    consumerGroup: config.consumerGroup ?? "$Default",
    cardinality: "many",
    handler: async (
      messages: unknown[],
      context: InvocationContext
    ): Promise<void> => {
      const logger = makeInvocationContextLogger(context);
      const useCase = useCaseFactory(logger);
      for (const message of messages) {
        const result = await useCase(inputMapper(message));
        if (result.isErr()) {
          context.error(`[${name}] failed to process message`, result.error);
        }
      }
    }
  });
};
