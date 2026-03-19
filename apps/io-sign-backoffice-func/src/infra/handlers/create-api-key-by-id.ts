import { InvocationContext, output } from "@azure/functions";

import { z } from "zod";

import { apiKeySchema } from "@io-sign/io-sign/api-key";
import * as E from "fp-ts/lib/Either";

import { IoTsType } from "./validation";

const inputDecoder = IoTsType(
  z.array(
    apiKeySchema.pick({
      id: true,
      institutionId: true
    })
  )
);

export const makeCreateApiKeyByIdHandler = (cosmosDbName: string) => {
  const apiKeysByIdOutput = output.cosmosDB({
    databaseName: cosmosDbName,
    containerName: "api-keys-by-id",
    createIfNotExists: false,
    connection: "COSMOS_DB_CONNECTION_STRING"
  });

  const handler = async (
    documents: unknown[],
    context: InvocationContext
  ): Promise<void> => {
    const result = inputDecoder.decode(documents);
    if (E.isLeft(result)) {
      context.warn(
        `createApiKeyById: invalid documents: ${JSON.stringify(result.left)}`
      );
      return;
    }
    context.extraOutputs.set(
      apiKeysByIdOutput,
      result.right.map((k) => ({ id: k.id, institutionId: k.institutionId }))
    );
  };

  return { apiKeysByIdOutput, handler };
};
