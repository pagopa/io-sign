import fetch from "node-fetch";
import { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { WebhookDeliveryClient } from "../../../domain/ports/outbound/webhook-delivery-client.js";
import type { WebhookDeliveryPayload } from "../../../domain/webhook-delivery-payload.js";

export const makeWebhookDeliveryClient = (): WebhookDeliveryClient => ({
  deliver: async (
    url: string,
    signature: string,
    publicKeyThumbprint: string,
    payload: WebhookDeliveryPayload
  ) => {
    try {
      const response = await fetch(url.replace(/\/$/, ""), {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-PublicKey-Thumbprint": publicKeyThumbprint
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return err(
          new GenericError(`webhook delivery returned ${response.status}`)
        );
      }
      return ok(undefined);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return err(new GenericError(`webhook delivery error: ${detail}`));
    }
  }
});
