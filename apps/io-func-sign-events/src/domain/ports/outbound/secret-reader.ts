import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";

export interface SecretReader {
  getSecret(secretName: string): Promise<Result<string, BaseError>>;
}
