import * as TE from "fp-ts/lib/TaskEither";
import { flow } from "fp-ts/lib/function";

import {
  SignatureRequestReady,
  SignatureRequestToBeSigned,
} from "@io-sign/io-sign/signature-request";

import { validate } from "@io-sign/io-sign/validation";

import {
  InsertSignatureRequest,
  NotifySignatureRequestWaitForSignatureEvent,
} from "../../signature-request";

export const makeCreateSignatureRequest = (
  insertSignatureRequest: InsertSignatureRequest,
  notifyWaitForSignatureEvent: NotifySignatureRequestWaitForSignatureEvent
) =>
  flow(
    (request: SignatureRequestReady): SignatureRequestToBeSigned => ({
      ...request,
      status: "WAIT_FOR_SIGNATURE",
      qrCodeUrl: "https://place-holder.com/qr-code",
    }),
    insertSignatureRequest,
    TE.chainEitherKW(
      validate(
        SignatureRequestToBeSigned,
        "Unable to validate the Signature Request."
      )
    ),
    TE.chainW(notifyWaitForSignatureEvent)
  );
