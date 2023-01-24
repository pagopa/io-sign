import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequestRejected } from "@io-sign/io-sign/signature-request";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  UpsertSignatureRequest,
  markAsRejected,
  GetSignatureRequest,
} from "../../signature-request";

export const makeMarkRequestAsRejected =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest
  ) =>
  (request: SignatureRequestRejected) =>
    pipe(
      pipe(request.issuerId, getSignatureRequest(request.id)),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("Signature Request not found.")
        )
      ),
      TE.chainEitherK(markAsRejected(request.rejectedAt, request.rejectReason)),
      TE.chain(upsertSignatureRequest)
    );
