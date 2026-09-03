import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";
import type { WebhookDeliveryPayload } from "../../webhook-delivery-payload";

export interface WebhookDeliveryClient {
  deliver(
    url: string,
    signature: string,
    publicKeyThumbprint: string,
    payload: WebhookDeliveryPayload
  ): Promise<Result<void, BaseError>>;
}
