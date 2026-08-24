import type { GenericError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { ok } from "neverthrow";
import { z } from "zod";
import type { BackofficeFunc } from "../ports/backoffice-func.js";
import type { SignEventsHub } from "../ports/sign-events-hub.js";
import pkg from "../../../package.json";

const APP_VERSION = pkg.version;

export interface InfoInput {
  query: string;
}

const healthStatus = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok") }),
  z.object({ status: z.literal("ko"), error: z.string() })
]);

export const InfoResponseSchema = z.object({
  message: z.string(),
  version: z.string(),
  health: z.object({
    signEventsHub: healthStatus,
    backofficeFunc: healthStatus
  })
});

export type InfoResponse = z.infer<typeof InfoResponseSchema>;

export type InfoUseCase = UseCase<InfoInput, InfoResponse, GenericError>;

export const makeInfoUseCase =
  (deps: {
    logger: Logger;
    signEventsHub: SignEventsHub;
    backofficeFunc: BackofficeFunc;
  }): InfoUseCase =>
  async () => {
    const [hubHealth, backofficeHealth] = await Promise.all([
      deps.signEventsHub.checkHealth(),
      deps.backofficeFunc.checkHealth()
    ]);
    return ok({
      message: "It's working!",
      version: APP_VERSION,
      health: {
        signEventsHub: hubHealth.match(
          () => ({ status: "ok" as const }),
          (error) => ({ status: "ko" as const, error: error.message })
        ),
        backofficeFunc: backofficeHealth.match(
          () => ({ status: "ok" as const }),
          (error) => ({ status: "ko" as const, error: error.message })
        )
      }
    });
  };
