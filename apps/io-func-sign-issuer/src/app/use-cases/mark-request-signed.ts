import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { createBillingEvent, SendBillingEvent } from "@io-sign/io-sign/event";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  UpsertSignatureRequest,
  markAsSigned,
  GetSignatureRequest,
} from "../../signature-request";

export const makeMarkRequestAsSigned =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    sendBillingEvent: SendBillingEvent
  ) =>
  (request: SignatureRequestSigned) =>
    pipe(
      pipe(request.issuerId, getSignatureRequest(request.id)),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("Signature Request not found.")
        )
      ),
      TE.chainEitherK(markAsSigned),
      TE.chain(upsertSignatureRequest),
      TE.chain(() =>
        pipe(
          request,
          /*
          The plan to use varies according to the environment used by the issuer.
          If it is in a test environment the free plan should be used otherwise standard.
          */
          createBillingEvent(
            request.issuerEnvironment === "TEST" ? "FREE" : "DEFAULT",
            request.issuerId
          ),
          sendBillingEvent
        )
      )
    );
