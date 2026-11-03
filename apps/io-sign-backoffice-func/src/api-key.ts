import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { ApiKey } from "@io-sign/io-sign/api-key";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

export type ApiKeyAccessControl = Pick<ApiKey, "environment" | "testers">;

export type ApiKeyRepository = {
  getApiKeyById(id: ApiKey["id"]): Promise<ApiKey | undefined>;
};

export const toApiKeyAccessControl = ({
  environment,
  testers
}: ApiKey): ApiKeyAccessControl => ({ environment, testers });

type ApiKeyEnvironment = {
  apiKeyRepository: ApiKeyRepository;
};

export const getApiKeyById = (id: ApiKey["id"]) => (r: ApiKeyEnvironment) =>
  pipe(
    TE.tryCatch(
      () => r.apiKeyRepository.getApiKeyById(id),
      () => new Error("Error retrieving the Api Key.")
    ),
    TE.flatMap(TE.fromNullable(new EntityNotFoundError("Api Key not found.")))
  );
