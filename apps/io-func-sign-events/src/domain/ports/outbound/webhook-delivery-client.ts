import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";
import { WebhookEvent } from "../../webhook-event";

export interface WebhookDeliveryClient {
  deliver(
    url: string,
    signature: string,
    publicKeyThumbprint: string,
    payload: WebhookEvent
  ): Promise<Result<void, BaseError>>;
}
