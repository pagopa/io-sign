import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { ok, err } from "neverthrow";
import { z } from "zod";
import type { BackofficeFunc } from "../ports/backoffice-func.js";
import type { SignEventsHub } from "../ports/sign-events-hub.js";
import pkg from "../../../package.json";

const APP_VERSION = pkg.version;

export interface InfoInput {
  query: string;
}

export const InfoResponseSchema = z.object({
  message: z.string(),
  version: z.string()
});

export type InfoResponse = z.infer<typeof InfoResponseSchema>;

export type InfoUseCase = UseCase<InfoInput, InfoResponse, ServiceUnavailableError>;

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
    const failures = [hubHealth, backofficeHealth].flatMap((r) =>
      r.isErr() ? [r.error.message] : []
    );
    if (failures.length > 0) {
      return err(new ServiceUnavailableError(failures.join("\n")));
    }
    return ok({ message: "It's working!", version: APP_VERSION });
  };
