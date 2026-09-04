import { app as azureApp } from "@azure/functions";
import type { InvocationContext } from "@azure/functions";
import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { makeInvocationContextLogger } from "./invocation-context-logger.js";

export type StorageQueueTriggerConfig = {
  connection: string;
  queueName: string;
};

/**
 * Registers an Azure Functions Storage Queue trigger from a use case.
 *
 * One message per invocation. On a use-case error the handler re-throws so the
 * runtime applies its retry policy and, once exhausted, moves the message to the
 * poison queue — never silently dropping a failed delivery.
 */
export const mountAzureFunctionsStorageQueueTrigger = <
  Input extends object,
  E extends BaseError
>(spec: {
  name: string;
  config: StorageQueueTriggerConfig;
  inputMapper: (message: unknown) => Input;
  useCaseFactory: (logger: Logger) => UseCase<Input, void, E>;
}): void => {
  const { name, config, inputMapper, useCaseFactory } = spec;

  azureApp.storageQueue(name, {
    connection: config.connection,
    queueName: config.queueName,
    handler: async (
      message: unknown,
      context: InvocationContext
    ): Promise<void> => {
      const logger = makeInvocationContextLogger(context);
      const useCase = useCaseFactory(logger);
      const result = await useCase(inputMapper(message));
      if (result.isErr()) {
        context.error(`[${name}] failed to process message`, result.error);
        throw result.error;
      }
    }
  });
};
