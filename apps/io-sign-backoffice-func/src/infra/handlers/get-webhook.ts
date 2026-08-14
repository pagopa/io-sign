import * as H from "@pagopa/handler-kit";
import { z } from "zod";

import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { flow } from "fp-ts/lib/function";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { getWebhook } from "@/webhook";
import { WebhookToApiModel } from "@/infra/http/encoders/webhook";
import { safeParse } from "./validation";

const pathSchema = z.object({
  issuerId: z.string().min(1),
  institutionId: z.string().uuid()
});

export const getWebhookHandler = H.of((req: H.HttpRequest) =>
  pipe(
    req.path,
    safeParse(pathSchema),
    RTE.fromEither,
    RTE.mapLeft(() => new H.HttpBadRequestError("Invalid path parameters.")),
    RTE.flatMap(getWebhook),
    RTE.map(flow(WebhookToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
