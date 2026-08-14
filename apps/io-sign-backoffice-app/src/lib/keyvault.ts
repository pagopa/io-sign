import { z } from "zod";
import { cache } from "react";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const KeyVaultConfig = z
  .object({
    KEY_VAULT_URL: z.string().url(),
  })
  .transform((env) => ({
    vaultUrl: env.KEY_VAULT_URL,
  }));
const getKeyVaultConfig = cache(() => {
  const result = KeyVaultConfig.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing key vault config", {
      cause: result.error.issues,
    });
  }
  return result.data;
});

let keyVaultClient: SecretClient | null = null;

export const getKeyVaultClient = () => {
  if (!keyVaultClient) {
    keyVaultClient = new SecretClient(getKeyVaultConfig().vaultUrl, new DefaultAzureCredential());
  }
  return keyVaultClient;
};
