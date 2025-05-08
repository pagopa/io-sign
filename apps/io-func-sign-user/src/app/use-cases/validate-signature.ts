/* eslint-disable no-case-declarations */
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { CreateAndSendAnalyticsEvent, EventName } from "@io-sign/io-sign/event";
import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import {
  SignatureRequestRejected,
  SignatureRequestSigned
} from "@io-sign/io-sign/signature-request";
import * as L from "@pagopa/logger";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as A from "fp-ts/lib/Array";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { GetBlobUrl } from "../../infra/azure/storage/blob";
import { GetSignatureRequest as GetQtspSignatureRequest } from "../../infra/namirial/signature-request";
import { SignatureRequest as QtspSignatureRequest } from "../../infra/namirial/signature-request";
import { GetSignature, Signature, UpsertSignature } from "../../signature";
import {
  NotifySignatureRequestRejectedEvent,
  NotifySignatureRequestSignedEvent,
  SignatureRequest,
  markAsRejected,
  markAsSigned
} from "../../signature-request";
import {
  GetSignatureRequest,
  UpsertSignatureRequest
} from "../../signature-request";

export const ValidateSignaturePayload = t.type({
  signatureId: NonEmptyString,
  signerId: NonEmptyString
});

export type ValidateSignaturePayload = t.TypeOf<
  typeof ValidateSignaturePayload
>;

export const makeMarkSignatureAndSignatureRequestAsRejected =
  (
    upsertSignature: UpsertSignature,
    upsertSignatureRequest: UpsertSignatureRequest,
    notifySignatureRequestRejectedEvent: NotifySignatureRequestRejectedEvent
  ) =>
  (signature: Signature, signatureRequest: SignatureRequest) =>
  (rejectedReason: string) =>
    pipe(
      {
        ...signature,
        status: "FAILED",
        rejectedReason
      },
      upsertSignature,
      TE.chainFirst(() =>
        pipe(
          signatureRequest,
          markAsRejected(rejectedReason),
          TE.fromEither,
          TE.chain(upsertSignatureRequest),
          TE.chainFirst((r) =>
            notifySignatureRequestRejectedEvent(r as SignatureRequestRejected)
          )
        )
      )
    );

type RetrievedQtspSignatureRequest =
  | {
      retrieved: true;
      qtspSignatureRequest: QtspSignatureRequest;
    }
  | { retrieved: false; error: Error };

export const makeValidateSignature =
  (
    getSignature: GetSignature,
    getSignedDocumentUrl: GetBlobUrl,
    upsertSignature: UpsertSignature,
    getSignatureRequest: GetSignatureRequest,
    upsertSignatureRequest: UpsertSignatureRequest,
    getQtspSignatureRequest: GetQtspSignatureRequest,
    notifySignatureRequestSignedEvent: NotifySignatureRequestSignedEvent,
    notifySignatureRequestRejectedEvent: NotifySignatureRequestRejectedEvent,
    createAndSendAnalyticsEvent: CreateAndSendAnalyticsEvent
  ) =>
  ({ signatureId, signerId }: ValidateSignaturePayload) => {
    const markSignatureAndSignatureRequestAsRejected =
      makeMarkSignatureAndSignatureRequestAsRejected(
        upsertSignature,
        upsertSignatureRequest,
        notifySignatureRequestRejectedEvent
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
          signature.signerId,
          getSignatureRequest(signature.signatureRequestId),
          TE.chainW(
            TE.fromOption(
              () => new EntityNotFoundError("Signature Request not found.")
            )
          ),
          TE.chain((signatureRequest) =>
            pipe(
              getQtspSignatureRequest(signatureRequest.issuerEnvironment)(
                signature.qtspSignatureRequestId
              ),
              TE.fold(
                (error): T.Task<RetrievedQtspSignatureRequest> =>
                  T.of({ retrieved: false, error }),
                (qtspSignatureRequest): T.Task<RetrievedQtspSignatureRequest> =>
                  T.of({ retrieved: true, qtspSignatureRequest })
              ),
              TE.fromTask,
              TE.chainFirstW((result) =>
                pipe(
                  signatureRequest,
                  !result.retrieved
                    ? createAndSendAnalyticsEvent(EventName.QTSP_API_ERROR)
                    : TE.right
                )
              ),
              TE.chain((result) =>
                result.retrieved
                  ? TE.right(result.qtspSignatureRequest)
                  : TE.left(result.error)
              ),
              TE.map((qtspSignatureRequest) => ({
                qtspSignatureRequest,
                signatureRequest
              }))
            )
          ),
          TE.chainW(({ qtspSignatureRequest, signatureRequest }) => {
            switch (qtspSignatureRequest.status) {
              case "CREATED":
                return pipe(
                  TE.left(
                    new Error(
                      "Signature request created by the QTSP but not ready yet. Retry!"
                    )
                  ),
                  TE.chainFirstIOK(() =>
                    L.debug("Signature request created by the QTSP", {
                      signatureRequest,
                      qtspSignatureRequest
                    })({
                      logger: ConsoleLogger
                    })
                  )
                );
              case "WAITING":
                return TE.left(
                  new Error("Signature request not ready yet. Retry!")
                );
              case "READY":
                return pipe(
                  signatureRequest,
                  createAndSendAnalyticsEvent(EventName.CERTIFICATE_CREATED),
                  TE.chainFirstIOK(() =>
                    L.debug("Certificate created", {
                      signatureRequest,
                      qtspSignatureRequest
                    })({
                      logger: ConsoleLogger
                    })
                  ),
                  TE.chain(() =>
                    TE.left(
                      new Error(
                        "Certificate created. Signature request not ready yet. Retry. Retry!"
                      )
                    )
                  )
                );

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
                        url: documentUrl
                      }))
                    )
                  ),
                  A.sequence(TE.ApplicativeSeq),
                  TE.map((documents) => ({
                    ...signatureRequest,
                    documents
                  })),
                  TE.chainEitherK(markAsSigned),
                  TE.chainFirst((r: SignatureRequest) =>
                    notifySignatureRequestSignedEvent(
                      r as SignatureRequestSigned
                    )
                  ),
                  TE.chain(upsertSignatureRequest),
                  // Upsert signature
                  TE.map(() => ({
                    ...signature,
                    status: "COMPLETED" as const
                  })),
                  TE.chain(upsertSignature),
                  TE.chainFirstIOK(() =>
                    L.debug("Signed by the QTSP", {
                      signatureRequest,
                      qtspSignatureRequest
                    })({
                      logger: ConsoleLogger
                    })
                  ),
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
                const errorDetail =
                  qtspSignatureRequest.last_error !== null
                    ? qtspSignatureRequest.last_error.detail
                    : "Invalid response status from QTSP!";
                return pipe(
                  errorDetail,
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
