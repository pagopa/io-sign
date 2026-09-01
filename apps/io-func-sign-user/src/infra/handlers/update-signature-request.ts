import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe } from "fp-ts/lib/function";

import { SignatureRequestCancelled } from "@io-sign/io-sign/signature-request";

import * as H from "@pagopa/handler-kit";
import { EventName } from "@io-sign/io-sign/event";
import { createAndSendSignEvent } from "@io-sign/io-sign/sign-event";
import {
  getSignatureRequest,
  markAsCancelled,
  upsertSignatureRequest
} from "../../signature-request";

export const UpdateSignatureRequestHandler = H.of(
  (signatureRequest: SignatureRequestCancelled) =>
    pipe(
      signatureRequest,
      ({ id, signerId }) => getSignatureRequest(id, signerId),
      RTE.chainEitherK(markAsCancelled(new Date())),
      RTE.chain(upsertSignatureRequest),
      RTE.chainFirstW(createAndSendSignEvent(EventName.SIGNATURE_CANCELLED))
    )
);
