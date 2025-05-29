import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  GetSignatureRequest,
  UpsertSignatureRequest,
  markAsWaitForSignature
} from "../../signature-request";

export const makeMarkRequestAsWaitForSignature =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest
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
      TE.chain(upsertSignatureRequest)
    );
