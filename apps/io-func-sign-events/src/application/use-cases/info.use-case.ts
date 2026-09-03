import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import { err, ok } from "neverthrow";
import type { BackofficeService } from "../../domain/ports/outbound/backoffice-service.js";
import type { SignEventPDNDPublisher } from "../../domain/ports/outbound/sign-event-pdnd-publisher.js";
import type { InfoUseCase } from "../contracts/info.js";
import pkg from "../../../package.json";
import { SignEventWebhookQueuePublisher } from "../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";

const APP_VERSION = pkg.version;

type InfoDeps = {
  logger: Logger;
  pdndPublisher: SignEventPDNDPublisher;
  backofficeService: BackofficeService;
  webhookQueuePublisher: SignEventWebhookQueuePublisher;
};

export const makeInfoUseCase =
  ({
    pdndPublisher,
    backofficeService,
    webhookQueuePublisher
  }: InfoDeps): InfoUseCase =>
  async () => {
    const [hubHealth, backofficeHealth, webhookQueueHealth] = await Promise.all(
      [
        pdndPublisher.checkHealth(),
        backofficeService.checkHealth(),
        webhookQueuePublisher.checkHealth()
      ]
    );
    const failures = [hubHealth, backofficeHealth, webhookQueueHealth].flatMap(
      (r) => (r.isErr() ? [r.error.message] : [])
    );
    if (failures.length > 0) {
      return err(new ServiceUnavailableError(failures.join("\n")));
    }
    return ok({ message: "It's working!", version: APP_VERSION });
  };
