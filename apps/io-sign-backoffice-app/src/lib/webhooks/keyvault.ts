import { getKeyVaultClient } from "../keyvault";

export async function upsertWebhookPrivateKey(
  secretName: string,
  privateKey: string
): Promise<void> {
  await getKeyVaultClient().setSecret(secretName, privateKey);
}