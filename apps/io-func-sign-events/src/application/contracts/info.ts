import type { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { UseCase } from "@pagopa/hexagonal-core/domain/ports";

export interface InfoInput {
  query: string;
}

export type InfoResponse = {
  message: string;
  version: string;
};

export type InfoUseCase = UseCase<
  InfoInput,
  InfoResponse,
  ServiceUnavailableError
>;
