import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Result } from "neverthrow";

export interface WebhookKeyReader {
  getPrivateKey(secretName: string): Promise<Result<string, BaseError>>;
}
