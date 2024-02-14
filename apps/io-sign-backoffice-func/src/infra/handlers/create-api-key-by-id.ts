import { z } from "zod";

import { ApiKey, apiKeySchema } from "@io-sign/io-sign/api-key";
import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { IoTsType } from "./validation";

export const inputDecoder = IoTsType(
  z.array(
    apiKeySchema.pick({
      id: true,
      institutionId: true,
    })
  )
);

export const handler = H.of(
  (apiKeys: Array<Pick<ApiKey, "id" | "institutionId">>) =>
    RTE.right(
      apiKeys.map((k) => ({ id: k.id, institutionId: k.institutionId }))
    )
);
