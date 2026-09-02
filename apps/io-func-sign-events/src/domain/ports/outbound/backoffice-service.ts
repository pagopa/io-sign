import type { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";
import z from "zod";

export interface BackofficeService {
  checkHealth(): Promise<Result<void, ServiceUnavailableError>>;
  getWebhookForIssuer(
    issuerId: string,
    institutionId: string
  ): Promise<Result<IssuerWebhook | undefined, ServiceUnavailableError>>; // TODO: need a specific error instead of ServiceUnavailableError?
}

export const issuerWebhookSchema = z.object({
  // id: z.string(),
  issuerId: z.string().min(1),
  url: z.url(),
  privateKeySecretName: z.string().min(1),
  publicKeyThumbprint: z.string().min(1),
  status: z.enum(["active", "inactive"])
});

export type IssuerWebhook = z.infer<typeof issuerWebhookSchema>;
