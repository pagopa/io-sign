import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import { err, ok } from "neverthrow";
import type { BackofficeService } from "../../domain/ports/outbound/backoffice-service.js";
import type { SignEventPublisher } from "../../domain/ports/outbound/sign-event-publisher.js";
import type { InfoUseCase } from "../contracts/info.js";
import pkg from "../../../package.json";

const APP_VERSION = pkg.version;

type InfoDeps = {
  logger: Logger;
  signEventPublisher: SignEventPublisher;
  backofficeService: BackofficeService;
};

export const makeInfoUseCase =
  ({ signEventPublisher, backofficeService }: InfoDeps): InfoUseCase =>
  async () => {
    const [hubHealth, backofficeHealth] = await Promise.all([
      signEventPublisher.checkHealth(),
      backofficeService.checkHealth()
    ]);
    const failures = [hubHealth, backofficeHealth].flatMap((r) =>
      r.isErr() ? [r.error.message] : []
    );
    if (failures.length > 0) {
      return err(new ServiceUnavailableError(failures.join("\n")));
    }
    return ok({ message: "It's working!", version: APP_VERSION });
  };
