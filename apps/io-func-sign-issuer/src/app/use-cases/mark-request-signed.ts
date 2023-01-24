import { EntityNotFoundError } from "@io-sign/io-sign/error";
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
    upsertSignatureRequest: UpsertSignatureRequest
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
      TE.chain(upsertSignatureRequest)
    );
