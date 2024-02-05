import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import {
  SignatureRequest,
  getSignatureRequest,
  upsertSignatureRequest,
} from "../../signature-request";

// TODO(): move here the signature request cancelation logic
// since CANCELLED is an "end status" such as SIGNED and REJECTED
// it should be treated in the same way, so:
// - the user should be notified by a Message
// - we should send a "CANCELLED" event to analytics

// "closeSignatureRequest" ends the Signature Request lifecycle
// A request is defined "CLOSED" when its status is one of: CANCELLED, SIGNED, REJECTED
// Closed requests cannot be modified, whatever its outcome.
export const closeSignatureRequest = (request: SignatureRequest) =>
  pipe(
    getSignatureRequest(request.id, request.issuerId),
    RTE.chain(upsertSignatureRequest)
  );
