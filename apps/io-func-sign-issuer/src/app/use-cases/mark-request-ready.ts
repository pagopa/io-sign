import { flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { SignatureRequestReady } from "@io-sign/io-sign/signature-request";
import { validate } from "@io-sign/io-sign/validation";
import {
  UpsertSignatureRequest,
  markAsReady,
  NotifySignatureRequestReadyEvent,
} from "../../signature-request";

// TODO: [SFEQS-1213] refactor the signature request state machine in order to ensure type safety
export const makeMarkRequestAsReady = (
  upsertSignatureRequest: UpsertSignatureRequest,
  notifyReadyEvent: NotifySignatureRequestReadyEvent
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
    TE.chain((request) => notifyReadyEvent(request))
  );
