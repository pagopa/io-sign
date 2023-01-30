import { EntityNotFoundError } from "@io-sign/io-sign/error";
import {
  createBillingEventFromIssuer,
  SendBillingEvent,
} from "@io-sign/io-sign/event";

import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import { GetIssuerById } from "../../issuer";

import {
  UpsertSignatureRequest,
  markAsSigned,
  GetSignatureRequest,
} from "../../signature-request";

export const makeMarkRequestAsSigned =
  (
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    sendBillingEvent: SendBillingEvent,
    getIssuerById: GetIssuerById
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
          getIssuerById(request.issuerId),
          TE.chain(
            TE.fromOption(() => new EntityNotFoundError("Issuer not found!"))
          )
        )
      ),
      TE.chain((issuer) =>
        pipe(request, createBillingEventFromIssuer(issuer), sendBillingEvent)
      )
    );
