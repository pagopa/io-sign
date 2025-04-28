import { CreateAndSendAnalyticsEvent, EventName } from "@io-sign/io-sign/event";
import { SignatureRequestReady } from "@io-sign/io-sign/signature-request";
import { validate } from "@io-sign/io-sign/validation";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import {
  NotifySignatureRequestReadyEvent,
  UpsertSignatureRequest,
  markAsReady
} from "../../signature-request";

// TODO: [SFEQS-1213] refactor the signature request state machine in order to ensure type safety
export const makeMarkRequestAsReady = (
  upsertSignatureRequest: UpsertSignatureRequest,
  notifyReadyEvent: NotifySignatureRequestReadyEvent,
  createAndSendAnalyticsEvent: CreateAndSendAnalyticsEvent
) =>
  flow(
    markAsReady,
    TE.fromEither,
    TE.chain(upsertSignatureRequest),
    TE.chainEitherKW(
      validate(
        SignatureRequestReady,
        "Unable to validate the Signature Request."
      )
    ),
    TE.chainFirstW((signatureRequest) =>
      pipe(
        signatureRequest,
        createAndSendAnalyticsEvent(EventName.SIGNATURE_READY)
      )
    ),
    TE.chain(notifyReadyEvent)
  );
