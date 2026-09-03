import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { err, ok } from "neverthrow";
import type { SignEvent } from "../../domain/sign-event.js";
import { SignEventWebhookQueuePublisher } from "../../domain/ports/outbound/sign-event-webhook-queue-publisher.js";
import {
  BackofficeService,
  IssuerWebhook
} from "../../domain/ports/outbound/backoffice-service.js";
import { WebhookQueueEvent } from "../../domain/webhook-queue-event.js";
import { WebhookEvent } from "../../domain/webhook-event.js";

type SignEventWebhookDeps = {
  logger: Logger;
  backofficeService: BackofficeService;
  webhookQueuePublisher: SignEventWebhookQueuePublisher;
};

const makeWebhookEvent = (signEvent: SignEvent): WebhookEvent | undefined => {
  const { signatureRequest } = signEvent.payload;
  const {
    id: signatureRequestId,
    status: signatureRequestStatus,
    documents
  } = signatureRequest;
  switch (signEvent.payloadType) {
    case "signature_request": {
      if (
        signatureRequestStatus !== "SIGNED" &&
        signatureRequestStatus !== "REJECTED"
      )
        return undefined;
      return {
        eventId: "",
        eventType: "signature-request.status.update",
        signatureRequestId,
        status: signatureRequestStatus,
        generatedAt: new Date(),
        timestamp: new Date()
      };
    }
    case "signature_request_document": {
      const { documentId } = signEvent.payload;
      const document = documents.find((doc) => doc.id === documentId);
      if (
        !document ||
        (document.status !== "READY" && document.status !== "REJECTED")
      )
        return undefined;
      return {
        eventId: "",
        eventType: "signature-request.document.status.update",
        signatureRequestId,
        documentId,
        documentStatus: document.status,
        generatedAt: new Date(),
        timestamp: new Date()
      };
    }
    default:
      return undefined;
  }
};

const makeWebhookQueueEvent = (
  { privateKeySecretName, publicKeyThumbprint, url }: IssuerWebhook,
  webhookEvent: WebhookEvent
): WebhookQueueEvent => ({
  retryCount: 0,
  webhookUrl: url,
  webhookPrivateKeySecretName: privateKeySecretName,
  webhookPublicKeyThumbprint: publicKeyThumbprint,
  webhookEvent
});

export const makeSignEventWebhookUseCase =
  ({
    logger,
    backofficeService,
    webhookQueuePublisher
  }: SignEventWebhookDeps): UseCase<SignEvent, void, BaseError> =>
  async (event) => {
    logger.info("sign event received by trigger for webhook", {
      eventName: event.eventName,
      payloadType: event.payloadType,
      payload: JSON.stringify(event.payload, null, 2)
    });

    const { issuerId, issuerInternalInstitutionId: institutionId } =
      event.payload.signatureRequest;
    const issuerWebhookResult = await backofficeService.getWebhookForIssuer(
      issuerId,
      institutionId
    );

    if (issuerWebhookResult.isErr()) {
      logger.error("failed to get webhook for issuer", {
        error: JSON.stringify(issuerWebhookResult.error)
      });
      return err(issuerWebhookResult.error);
    }

    if (issuerWebhookResult.value?.status === "active") {
      const webhookEvent = makeWebhookEvent(event);
      if (!webhookEvent) return ok(undefined);

      const webhookQueueEvent = makeWebhookQueueEvent(
        issuerWebhookResult.value,
        webhookEvent
      );

      const enqueueResult =
        await webhookQueuePublisher.enqueue(webhookQueueEvent);
      if (enqueueResult.isErr()) {
        logger.error("failed to enqueue webhook queue event", {
          error: JSON.stringify(enqueueResult.error)
        });
        return err(enqueueResult.error);
      }
    }

    return ok(undefined);
  };
