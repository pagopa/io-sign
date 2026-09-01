import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as A from "fp-ts/lib/Array";

import { pipe } from "fp-ts/lib/function";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as L from "@pagopa/logger";
import * as t from "io-ts";

import {
  SignatureRequestRejected,
  SignatureRequestSigned
} from "@io-sign/io-sign/signature-request";
import { EventName } from "@io-sign/io-sign/event";
import { CreateAndSendSignEvent } from "@io-sign/io-sign/sign-event";
import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import {
  markAsRejected,
  markAsSigned,
  NotifySignatureRequestRejectedEvent,
  NotifySignatureRequestSignedEvent,
  SignatureRequest
} from "../../signature-request";
import { GetSignature, Signature, UpsertSignature } from "../../signature";
import { GetSignatureRequest as GetQtspSignatureRequest } from "../../infra/namirial/signature-request";
import {
  GetSignatureRequest,
  UpsertSignatureRequest
} from "../../signature-request";
import { GetBlobUrl } from "../../infra/azure/storage/blob";

import { SignatureRequest as QtspSignatureRequest } from "../../infra/namirial/signature-request";

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

type MarkSignatureAndSignatureRequestAsRejected = ReturnType<
  typeof makeMarkSignatureAndSignatureRequestAsRejected
>;

type RetrievedQtspSignatureRequest =
  | {
      retrieved: true;
      qtspSignatureRequest: QtspSignatureRequest;
    }
  | { retrieved: false; error: Error };

const makeHandleCompletedStatus =
  (
    getSignedDocumentUrl: GetBlobUrl,
    upsertSignatureRequest: UpsertSignatureRequest,
    upsertSignature: UpsertSignature,
    notifySignatureRequestSignedEvent: NotifySignatureRequestSignedEvent,
    markSignatureAndSignatureRequestAsRejected: MarkSignatureAndSignatureRequestAsRejected
  ) =>
  (
    signature: Signature,
    signatureRequest: SignatureRequest,
    qtspSignatureRequest: QtspSignatureRequest
  ) =>
    pipe(
      // Upsert signatureRequest documents url with signed url
      signatureRequest.documents,
      A.map((document) =>
        pipe(
          getSignedDocumentUrl(document.id),
          TE.fromOption(
            () => new Error(`Signed document with id: ${document.id} not found`)
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
        notifySignatureRequestSignedEvent(r as SignatureRequestSigned)
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

const handleCreatedStatus = (
  signatureRequest: SignatureRequest,
  qtspSignatureRequest: QtspSignatureRequest
) =>
  pipe(
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

const handleFailedStatus = (
  signature: Signature,
  signatureRequest: SignatureRequest,
  qtspSignatureRequest: QtspSignatureRequest,
  markSignatureAndSignatureRequestAsRejected: MarkSignatureAndSignatureRequestAsRejected
) => {
  const errorDetail =
    qtspSignatureRequest.last_error !== null
      ? qtspSignatureRequest.last_error.detail
      : "Invalid response status from QTSP!";
  return pipe(
    errorDetail,
    markSignatureAndSignatureRequestAsRejected(signature, signatureRequest)
  );
};

const makeHandleReadyStatus =
  (createAndSendSignEvent: CreateAndSendSignEvent) =>
  (
    signatureRequest: SignatureRequest,
    qtspSignatureRequest: QtspSignatureRequest
  ) =>
    pipe(
      signatureRequest,
      createAndSendSignEvent(EventName.CERTIFICATE_CREATED),
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

const handleDefaultStatus = (
  signature: Signature,
  signatureRequest: SignatureRequest,
  markSignatureAndSignatureRequestAsRejected: MarkSignatureAndSignatureRequestAsRejected
) =>
  pipe(
    "Invalid response status from QTSP!",
    markSignatureAndSignatureRequestAsRejected(signature, signatureRequest)
  );

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
    createAndSendSignEvent: CreateAndSendSignEvent
  ) =>
  ({ signatureId, signerId }: ValidateSignaturePayload) => {
    const markSignatureAndSignatureRequestAsRejected =
      makeMarkSignatureAndSignatureRequestAsRejected(
        upsertSignature,
        upsertSignatureRequest,
        notifySignatureRequestRejectedEvent
      );
    const handleCompletedStatus = makeHandleCompletedStatus(
      getSignedDocumentUrl,
      upsertSignatureRequest,
      upsertSignature,
      notifySignatureRequestSignedEvent,
      markSignatureAndSignatureRequestAsRejected
    );
    const handleReadyStatus = makeHandleReadyStatus(createAndSendSignEvent);
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
              TE.tap((result) =>
                !result.retrieved
                  ? pipe(
                      signatureRequest,
                      createAndSendSignEvent(EventName.QTSP_API_ERROR)
                    )
                  : TE.right(undefined)
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
              case "COMPLETED":
                return handleCompletedStatus(
                  signature,
                  signatureRequest,
                  qtspSignatureRequest
                );
              case "CREATED":
                return handleCreatedStatus(
                  signatureRequest,
                  qtspSignatureRequest
                );
              case "FAILED":
                return handleFailedStatus(
                  signature,
                  signatureRequest,
                  qtspSignatureRequest,
                  markSignatureAndSignatureRequestAsRejected
                );
              case "READY":
                return handleReadyStatus(
                  signatureRequest,
                  qtspSignatureRequest
                );
              case "WAITING":
                return TE.left(
                  new Error("Signature request not ready yet. Retry!")
                );
              default:
                return handleDefaultStatus(
                  signature,
                  signatureRequest,
                  markSignatureAndSignatureRequestAsRejected
                );
            }
          })
        )
      )
    );
  };
