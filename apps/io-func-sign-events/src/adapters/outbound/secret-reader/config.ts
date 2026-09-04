import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    IoSignKeyVaultUrl: z.url()
  })
  .transform((env) => ({
    vaultUrl: env.IoSignKeyVaultUrl
  }));

export type SecretReaderConfig = z.infer<typeof ConfigFromEnvironment>;

export const getSecretReaderConfigFromEnvironment = (): SecretReaderConfig => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing SecretReader config", {
      cause: result.error.issues
    });
  }
  return result.data;
};
