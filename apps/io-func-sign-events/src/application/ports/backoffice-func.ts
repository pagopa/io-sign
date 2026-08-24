import type { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";

export interface BackofficeFunc {
  checkHealth(): Promise<Result<void, ServiceUnavailableError>>;
}
