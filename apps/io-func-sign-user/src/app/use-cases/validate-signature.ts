import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { sequenceS } from "fp-ts/lib/Apply";
import { markAsRejected } from "../../signature-request";
import {
  GetSignature,
  SignatureStatus,
  UpsertSignature,
} from "../../signature";
import { GetSignatureRequest as GetQtspSignatureRequest } from "../../infra/namirial/signature-request";
import {
  GetSignatureRequest,
  UpsertSignatureRequest,
} from "../../signature-request";

export const ValidateSignaturePayload = t.type({
  signatureId: NonEmptyString,
  signerId: NonEmptyString,
});

export type ValidateSignaturePayload = t.TypeOf<
  typeof ValidateSignaturePayload
>;

// TODO [SFEQS-1156]: Retrieve signed files from QTSP and sending message
export const makeValidateSignature =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    getSignature: GetSignature,
    upsertSignature: UpsertSignature,
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    getQtspSignatureRequest: GetQtspSignatureRequest
  ) =>
  ({ signatureId, signerId }: ValidateSignaturePayload) =>
    pipe(
      signerId,
      getSignature(signatureId),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError(`Signature ${signatureId} not found`)
        )
      ),
      TE.chainW((signature) =>
        pipe(
          sequenceS(TE.ApplicativeSeq)({
            qtspSignatureRequest: getQtspSignatureRequest(
              signature.qtspSignatureRequestId
            ),
            signatureRequest: pipe(
              signature.signerId,
              getSignatureRequest(signature.signatureRequestId),
              TE.chainW(
                TE.fromOption(
                  () => new EntityNotFoundError("Signature Request not found.")
                )
              )
            ),
          }),

          TE.chainW(({ qtspSignatureRequest, signatureRequest }) => {
            switch (qtspSignatureRequest.status) {
              case "CREATED":
              case "WAITING":
                return TE.left(new Error("Signature not ready yet. Retry!"));
              case "READY":
              case "COMPLETED":
                return TE.right(signature);
              case "FAILED":
                const rejectedReason =
                  qtspSignatureRequest.last_error !== null
                    ? qtspSignatureRequest.last_error.detail
                    : "Rejected reason not found!";

                return pipe(
                  {
                    ...signature,
                    status: SignatureStatus.FAILED,
                    rejectedReason,
                  },
                  upsertSignature,
                  TE.chainFirst(() =>
                    pipe(
                      signatureRequest,
                      markAsRejected(rejectedReason),
                      TE.fromEither,
                      TE.chain(upsertSignatureRequest)
                    )
                  )
                );
              default:
                return pipe(
                  {
                    ...signature,
                    status: SignatureStatus.FAILED,
                    rejectedReason: "Invalid response status from QTSP!",
                  },
                  upsertSignature,
                  TE.chainFirst(() =>
                    pipe(
                      signatureRequest,
                      markAsRejected("Invalid response status from QTSP!"),
                      TE.fromEither,
                      TE.chain(upsertSignatureRequest)
                    )
                  )
                );
            }
          })
        )
      )
    );
