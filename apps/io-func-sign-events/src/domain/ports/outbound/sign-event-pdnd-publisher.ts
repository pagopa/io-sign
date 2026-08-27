import type {
  GenericError,
  ServiceUnavailableError
} from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";
import type { AnalyticsEvent, BillingEvent } from "../../pdnd-event.js";

export interface SignEventPDNDPublisher {
  checkHealth(): Promise<Result<void, ServiceUnavailableError>>;
  sendAnalyticsEvent(
    event: AnalyticsEvent
  ): Promise<Result<void, GenericError>>;
  sendBillingEvent(event: BillingEvent): Promise<Result<void, GenericError>>;
}
