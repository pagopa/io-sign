import type { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";

export interface SignEventPDNDPublisher {
  checkHealth(): Promise<Result<void, ServiceUnavailableError>>;
  sendAnalyticsEvent(event: SignEvent): Promise<Result<void, GenericError>>;
  // sendBillingEvent(event: SignEvent): Promise<Result<void, GenericError>>;
}
