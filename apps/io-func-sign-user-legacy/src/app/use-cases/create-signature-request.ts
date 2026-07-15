import * as TE from "fp-ts/lib/TaskEither";
import { flow } from "fp-ts/lib/function";

import {
  GenerateSignatureRequestQrCode,
  SignatureRequestReady,
  SignatureRequestToBeSigned
} from "@io-sign/io-sign/signature-request";

import { validate } from "@io-sign/io-sign/validation";

import {
  NotifySignatureRequestWaitForSignatureEvent,
  UpsertSignatureRequest
} from "../../signature-request";

export const makeCreateSignatureRequest = (
  upsertSignatureRequest: UpsertSignatureRequest,
  notifyWaitForSignatureEvent: NotifySignatureRequestWaitForSignatureEvent,
  generateSignatureRequestQrCode: GenerateSignatureRequestQrCode
) =>
  flow(
    (request: SignatureRequestReady): SignatureRequestToBeSigned => ({
      ...request,
      status: "WAIT_FOR_SIGNATURE",
      qrCodeUrl: generateSignatureRequestQrCode(request.id)
    }),
    upsertSignatureRequest,
    TE.chainEitherKW(
      validate(
        SignatureRequestToBeSigned,
        "Unable to validate the Signature Request."
      )
    ),
    TE.chainW(notifyWaitForSignatureEvent)
  );
