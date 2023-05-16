import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe } from "fp-ts/lib/function";

import { SignatureRequestCanceled } from "@io-sign/io-sign/signature-request";

import * as H from "@pagopa/handler-kit";
import {
  getSignatureRequest,
  markAsCanceled,
  upsertSignatureRequest,
} from "../../signature-request";

export const CancelSignatureRequestHandler = H.of(
  (signatureRequest: SignatureRequestCanceled) =>
    pipe(
      signatureRequest,
      ({ id, signerId }) => getSignatureRequest(id, signerId),
      RTE.chainEitherK(markAsCanceled(new Date())),
      RTE.chain(upsertSignatureRequest)
    )
);
