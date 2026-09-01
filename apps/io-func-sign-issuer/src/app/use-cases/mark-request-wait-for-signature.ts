import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  GetSignatureRequest,
  markAsWaitForSignature,
  UpsertSignatureRequest
} from "../../signature-request";
import { CreateAndSendSignEvent, EventName } from "@io-sign/io-sign/sign-event";

export const makeMarkRequestAsWaitForSignature =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    createAndSendSignEvent: CreateAndSendSignEvent
  ) =>
  (request: SignatureRequestToBeSigned) =>
    pipe(
      pipe(request.issuerId, getSignatureRequest(request.id)),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("Signature Request not found.")
        )
      ),
      TE.chainEitherK(markAsWaitForSignature(request.qrCodeUrl)),
      TE.chain(upsertSignatureRequest),
      TE.chainFirstW(
        createAndSendSignEvent(EventName.SIGNATURE_WAIT_FOR_SIGNATURE)
      )
    );
