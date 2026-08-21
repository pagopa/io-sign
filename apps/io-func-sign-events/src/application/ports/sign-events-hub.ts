import type { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";

export interface SignEventsHub {
  checkHealth(): Promise<Result<void, ServiceUnavailableError>>;
  // future: sendEvent(event: SignEvent): Promise<Result<void, GenericError>>;
}
