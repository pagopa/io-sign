import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import {
  GenericError,
  NotFoundError
} from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { SecretReader } from "../../../domain/ports/outbound/secret-reader.js";
import type { SecretReaderConfig } from "./config.js";

export const makeSecretReader = (config: SecretReaderConfig): SecretReader => {
  const secretClient = new SecretClient(
    config.vaultUrl,
    new DefaultAzureCredential()
  );
  return {
    getSecret: async (secretName) => {
      try {
        const { value } = await secretClient.getSecret(secretName);
        if (!value) {
          return err(
            new NotFoundError(secretName, `key vault secret not found`)
          );
        }
        return ok(value);
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        return err(
          new GenericError(
            `key vault error reading secret "${secretName}": ${detail}`
          )
        );
      }
    }
  };
};
