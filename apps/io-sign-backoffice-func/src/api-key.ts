import { ApiKey } from "@io-sign/io-sign/api-key";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export interface ApiKeyRepository {
  getApiKeyById(id: ApiKey["id"]): Promise<ApiKey | undefined>;
}

interface ApiKeyEnvironment {
  apiKeyRepository: ApiKeyRepository;
}

export const getApiKeyById = (id: ApiKey["id"]) => (r: ApiKeyEnvironment) =>
  pipe(
    TE.tryCatch(
      () => r.apiKeyRepository.getApiKeyById(id),
      () => new Error("Error retrieving the Api Key.")
    ),
    TE.flatMap(TE.fromNullable(new EntityNotFoundError("Api Key not found.")))
  );
