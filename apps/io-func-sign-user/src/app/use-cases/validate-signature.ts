import * as TE from "fp-ts/lib/TaskEither";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import { sequenceS } from "fp-ts/lib/Apply";
import {
  markAsRejected,
  markAsSigned,
  SignatureRequest,
} from "../../signature-request";
import {
  GetSignature,
  Signature,
  SignatureStatus,
  UpsertSignature,
} from "../../signature";
import { GetSignatureRequest as GetQtspSignatureRequest } from "../../infra/namirial/signature-request";
import {
  GetSignatureRequest,
  UpsertSignatureRequest,
} from "../../signature-request";
import { GetBlobUrl } from "../../infra/azure/storage/blob";

export const ValidateSignaturePayload = t.type({
  signatureId: NonEmptyString,
  signerId: NonEmptyString,
});

export type ValidateSignaturePayload = t.TypeOf<
  typeof ValidateSignaturePayload
>;

export const makeMarkSignatureAndSignatureRequestAsRejected =
  (
    upsertSignature: UpsertSignature,
    upsertSignatureRequest: UpsertSignatureRequest
  ) =>
  (signature: Signature, signatureRequest: SignatureRequest) =>
  (rejectedReason: string) =>
    pipe(
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

// TODO [SFEQS-1156]: Add sending message
export const makeValidateSignature =
  (
    getSignature: GetSignature,
    getSignedDocumentUrl: GetBlobUrl,
    upsertSignature: UpsertSignature,
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    getQtspSignatureRequest: GetQtspSignatureRequest
  ) =>
  ({ signatureId, signerId }: ValidateSignaturePayload) => {
    const markSignatureAndSignatureRequestAsRejected =
      makeMarkSignatureAndSignatureRequestAsRejected(
        upsertSignature,
        upsertSignatureRequest
      );
    return pipe(
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
                return pipe(
                  // Upsert signatureRequest documents url with signed url
                  signatureRequest.documents,
                  A.map((document) =>
                    pipe(
                      getSignedDocumentUrl(document.id),
                      TE.fromOption(
                        () =>
                          new Error(
                            `Signed document with id: ${document.id} not found`
                          )
                      ),
                      TE.map((documentUrl) => ({
                        ...document,
                        url: documentUrl,
                      }))
                    )
                  ),
                  A.sequence(TE.ApplicativeSeq),
                  TE.map((documents) => ({
                    ...signatureRequest,
                    documents,
                  })),
                  TE.chainEitherK(markAsSigned),
                  TE.chain(upsertSignatureRequest),
                  // Upsert signature
                  TE.map(() => ({
                    ...signature,
                    status: SignatureStatus.COMPLETED,
                  })),
                  TE.chain(upsertSignature),
                  TE.alt(() =>
                    pipe(
                      "Signed document not found!",
                      markSignatureAndSignatureRequestAsRejected(
                        signature,
                        signatureRequest
                      )
                    )
                  )
                );
              case "FAILED":
                return pipe(
                  qtspSignatureRequest.last_error !== null
                    ? qtspSignatureRequest.last_error.detail
                    : "Rejected reason not found!",
                  markSignatureAndSignatureRequestAsRejected(
                    signature,
                    signatureRequest
                  )
                );

              default:
                return pipe(
                  "Invalid response status from QTSP!",
                  markSignatureAndSignatureRequestAsRejected(
                    signature,
                    signatureRequest
                  )
                );
            }
          })
        )
      )
    );
  };
