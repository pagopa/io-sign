import fetch from "node-fetch";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import {
  type BackofficeService,
  issuerWebhookSchema
} from "../../../domain/ports/outbound/backoffice-service.js";
import type { BackofficeServiceConfig } from "./config.js";

export const makeBackofficeService = (
  config: BackofficeServiceConfig
): BackofficeService => ({
  checkHealth: async () => {
    try {
      const baseUrl = config.baseUrl.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/info`, {
        headers: { "x-functions-key": config.apiKey },
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) {
        return err(
          new ServiceUnavailableError(
            `backoffice-service returned ${response.status}`
          )
        );
      }
      return ok(undefined);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return err(
        new ServiceUnavailableError(`backoffice-service unreachable: ${detail}`)
      );
    }
  },
  getWebhookForIssuer: async (issuerId, institutionId) => {
    try {
      const baseUrl = config.baseUrl.replace(/\/$/, "");
      const response = await fetch(
        `${baseUrl}/institutions/${institutionId}/issuers/${issuerId}/webhook`,
        {
          headers: { "x-functions-key": config.apiKey },
          signal: AbortSignal.timeout(5000)
        }
      );

      if (!response.ok) {
        if (response.status === 404) return ok(undefined);
        return err(
          new ServiceUnavailableError(
            `backoffice-service returned ${response.status}`
          )
        );
      }

      const webhook = issuerWebhookSchema.safeParse(await response.json());
      return ok(webhook.data);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return err(
        new ServiceUnavailableError(`backoffice-service unreachable: ${detail}`)
      );
    }
  }
});
