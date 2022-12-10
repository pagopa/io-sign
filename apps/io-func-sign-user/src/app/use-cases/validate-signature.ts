import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetFiscalCodeBySignerId } from "@io-sign/io-sign/signer";

import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import {
  GetSignature,
  SignatureStatus,
  UpsertSignature,
} from "../../signature";
import { GetSignatureRequest as GetQtspSignatureRequest } from "../../infra/namirial/signature-request";

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
          getQtspSignatureRequest(signature.qtspSignatureRequestId),
          TE.chainW((qtspSignatureRequest) => {
            switch (qtspSignatureRequest.status) {
              case "CREATED":
              case "READY":
              case "WAITING":
              case "COMPLETED":
                return TE.right(signature);
              case "FAILED":
                return pipe(
                  {
                    ...signature,
                    status: SignatureStatus.FAILED,
                    rejectedReason:
                      qtspSignatureRequest.last_error !== null
                        ? qtspSignatureRequest.last_error.detail
                        : "Rejected reason not found!",
                  },
                  upsertSignature
                );
              default:
                return pipe(
                  {
                    ...signature,
                    status: SignatureStatus.FAILED,
                    rejectedReason: "Invalid response status from QTSP!",
                  },
                  upsertSignature
                );
            }
          })
        )
      )
    );
