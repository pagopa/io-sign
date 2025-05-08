import { GetDocumentUrl } from "@io-sign/io-sign/document-url";
import {
  ActionNotAllowedError,
  EntityNotFoundError
} from "@io-sign/io-sign/error";
import { Id } from "@io-sign/io-sign/id";
import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import { GetFiscalCodeBySignerId, Signer } from "@io-sign/io-sign/signer";
import {
  stringFromBase64Encode,
  stringToBase64Encode
} from "@io-sign/io-sign/utility";
import { validate } from "@io-sign/io-sign/validation";
import * as L from "@pagopa/logger";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as J from "fp-ts/Json";
import { sequenceS } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { CreateSignatureRequest as CreateQtspSignatureRequest } from "../../infra/namirial/signature-request";
import { QtspClauses } from "../../qtsp";
import {
  InsertSignature,
  NotifySignatureReadyEvent,
  SignatureValidationParams,
  newSignature
} from "../../signature";
import { DocumentToSign } from "../../signature-field";
import {
  GetSignatureRequest,
  UpsertSignatureRequest,
  canBeWaitForQtsp,
  markAsWaitForQtsp
} from "../../signature-request";

export const CreateSignaturePayload = t.type({
  signatureRequestId: NonEmptyString,
  signer: Signer,
  qtspClauses: QtspClauses,
  documentsSignature: t.array(DocumentToSign),
  email: EmailString,
  signatureValidationParams: SignatureValidationParams
});

export type CreateSignaturePayload = t.TypeOf<typeof CreateSignaturePayload>;

const makeGetDocumentUrlForSignature =
  (
    getSignatureRequest: GetSignatureRequest,
    getDownloadDocumentUrl: GetDocumentUrl,
    getUploadSignedDocumentUrl: GetDocumentUrl
  ) =>
  (signerId: Id) =>
  (signatureRequestId: Id) =>
  (documentId: Id) =>
    pipe(
      signerId,
      getSignatureRequest(signatureRequestId),
      TE.chain(
        TE.fromOption(
          () =>
            new EntityNotFoundError(
              "The specified Signature Request does not exists."
            )
        )
      ),
      TE.map((signatureRequest) => signatureRequest.documents),
      TE.chain(
        flow(
          A.filter((el) => el.id === documentId),
          A.head,
          TE.fromOption(
            () =>
              new EntityNotFoundError(
                "The specified documentID does not exists."
              )
          )
        )
      ),
      TE.chain((document) =>
        sequenceS(TE.ApplicativeSeq)({
          urlIn: pipe(
            document,
            getDownloadDocumentUrl,
            TE.chainEitherKW(validate(NonEmptyString, "Invalid download url"))
          ),
          urlOut: pipe(
            document,
            getUploadSignedDocumentUrl,
            TE.chainEitherKW(validate(NonEmptyString, "Invalid upload url"))
          )
        })
      ),
      TE.chainFirstIOK((documentsUrl) =>
        L.debug("get documents url", { documentsUrl })({
          logger: ConsoleLogger
        })
      )
    );

/** Send a signature request to QTSP, create the Signature entity
 *  and enqueue Signature for future validation
 */
export const makeCreateSignature =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    creatQtspSignatureRequest: CreateQtspSignatureRequest,
    insertSignature: InsertSignature,
    notifySignatureReadyEvent: NotifySignatureReadyEvent,
    getSignatureRequest: GetSignatureRequest,
    getDownloadDocumentUrl: GetDocumentUrl,
    getUploadSignedDocumentUrl: GetDocumentUrl,
    upsertSignatureRequest: UpsertSignatureRequest
  ) =>
  ({
    signatureRequestId,
    signer,
    qtspClauses,
    documentsSignature,
    email,
    signatureValidationParams
  }: CreateSignaturePayload) => {
    const getDocumentUrlForSignature = pipe(
      signatureRequestId,
      makeGetDocumentUrlForSignature(
        getSignatureRequest,
        getDownloadDocumentUrl,
        getUploadSignedDocumentUrl
      )(signer.id)
    );

    const retrieveSignatureRequest = pipe(
      signer.id,
      getSignatureRequest(signatureRequestId),
      TE.chain(
        TE.fromOption(
          () =>
            new EntityNotFoundError(
              `Signature request ${signatureRequestId} not found`
            )
        )
      )
    );

    const createSignatureRequest = pipe(
      sequenceS(TE.ApplicativeSeq)({
        fiscalCode: pipe(
          signer.id,
          getFiscalCodeBySignerId,
          TE.chain(
            TE.fromOption(
              () =>
                new EntityNotFoundError(
                  "Fiscal code not found for this signer!"
                )
            )
          )
        ),
        documentsToSign: pipe(
          documentsSignature,
          A.map((documentSignature) =>
            pipe(
              documentSignature.documentId,
              getDocumentUrlForSignature,
              TE.map((documentUrl) => ({
                ...documentUrl,
                signatureFields: documentSignature.signatureFields
              }))
            )
          ),
          A.sequence(TE.ApplicativeSeq)
        ),
        signatureRequest: retrieveSignatureRequest
      }),
      TE.chain(({ documentsToSign, fiscalCode, signatureRequest }) =>
        pipe(
          TE.of({
            fiscalCode,
            publicKey: signatureValidationParams.publicKey,
            spidAssertion: signatureValidationParams.samlAssertionBase64,
            email,
            documentLink: qtspClauses.filledDocumentUrl,
            tosSignature: signatureValidationParams.tosSignature,
            signature: signatureValidationParams.challengeSignature,
            nonce: qtspClauses.nonce,
            documentsToSign,
            signatureInput: signatureValidationParams.signatureInput
          }),
          TE.chainEitherKW((createSignaturePayload) =>
            pipe(
              createSignaturePayload.signatureInput,
              stringToBase64Encode,
              E.chainW(
                validate(
                  NonEmptyString,
                  "Unable to convert signatureInput to base64 string"
                )
              ),
              E.map((signatureInput) => ({
                ...createSignaturePayload,
                signatureInput
              }))
            )
          ),
          TE.chainEitherKW((createSignaturePayload) =>
            pipe(
              createSignaturePayload.publicKey,
              stringFromBase64Encode,
              E.chain(J.parse),
              E.chain(J.stringify),
              E.mapLeft(() => new Error("Unable to parse public key")),
              E.chainW(stringToBase64Encode),
              E.chainW(
                validate(
                  NonEmptyString,
                  "Unable to convert publicKey to base64 string"
                )
              ),
              E.map((publicKey) => ({
                ...createSignaturePayload,
                publicKey
              }))
            )
          ),
          TE.chainFirstIOK((payload) =>
            L.debug("create QTSP SignatureRequest with payload", {
              payload
            })({
              logger: ConsoleLogger
            })
          ),
          TE.chain(
            creatQtspSignatureRequest(signatureRequest.issuerEnvironment)
          ),
          TE.chainFirstIOK((qtspSignatureRequest) =>
            L.info("created QTSP signature request with id", {
              id: qtspSignatureRequest.id
            })({
              logger: ConsoleLogger
            })
          ),
          TE.filterOrElse(
            (qtspResponse) => qtspResponse.status === "CREATED",
            (e) =>
              e.last_error !== null
                ? new ActionNotAllowedError(
                    `An error occurred while the QTSP was creating the signature. ${e.last_error.detail}`
                  )
                : new ActionNotAllowedError(
                    "An error occurred while the QTSP was creating the signature."
                  )
          ),
          TE.chainW((qtspResponse) =>
            pipe(
              newSignature(signer, signatureRequestId, qtspResponse.id),
              insertSignature
            )
          ),
          TE.chainFirst(() =>
            pipe(
              signatureRequest,
              markAsWaitForQtsp,
              TE.fromEither,
              TE.chain(upsertSignatureRequest)
            )
          ),
          TE.chainFirst((signature) =>
            pipe(
              {
                signatureId: signature.id,
                signerId: signature.signerId
              },
              notifySignatureReadyEvent
            )
          )
        )
      )
    );

    return pipe(
      retrieveSignatureRequest,
      TE.map(canBeWaitForQtsp),
      TE.chain((canBeCreated) =>
        !canBeCreated
          ? TE.left(
              new ActionNotAllowedError(
                "Signature can only be created if the signature request is in WAIT_FOR_SIGNATURE or REJECTED status!"
              )
            )
          : createSignatureRequest
      )
    );
  };
