import type { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";

export interface BackofficeService {
  checkHealth(): Promise<Result<void, ServiceUnavailableError>>;
}
