import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { WebhookKeyReader } from "../../../domain/ports/outbound/webhook-key-reader.js";
import type { WebhookKeyReaderConfig } from "./config.js";

export const makeWebhookKeyReader = (
  config: WebhookKeyReaderConfig
): WebhookKeyReader => {
  const secretClient = new SecretClient(
    config.vaultUrl,
    new DefaultAzureCredential()
  );
  return {
    getPrivateKey: async (secretName) => {
      try {
        const { value } = await secretClient.getSecret(secretName);
        if (!value) {
          return err(
            new GenericError(`key vault secret "${secretName}" has no value`)
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
