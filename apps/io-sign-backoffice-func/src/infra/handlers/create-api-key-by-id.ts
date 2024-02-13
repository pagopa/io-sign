import { ApiKey, apiKeySchema } from "@io-sign/io-sign/api-key";
import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { IoTsType } from "./validation";

export const inputDecoder = IoTsType(
  apiKeySchema.pick({
    id: true,
    institutionId: true,
  })
);

export const createApiKeyByIdHandler = H.of(
  (k: Pick<ApiKey, "id" | "institutionId">) =>
    RTE.right({ id: k.id, institutionId: k.institutionId })
);
