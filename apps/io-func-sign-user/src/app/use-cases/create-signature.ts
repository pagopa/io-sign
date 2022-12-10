import { GetFiscalCodeBySignerId, Signer } from "@io-sign/io-sign/signer";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";
import * as A from "fp-ts/lib/Array";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe, flow } from "fp-ts/lib/function";
import {
  ActionNotAllowedError,
  EntityNotFoundError,
} from "@io-sign/io-sign/error";

import { Id } from "@io-sign/io-sign/id";

import { sequenceS } from "fp-ts/lib/Apply";
import { validate } from "@io-sign/io-sign/validation";
import { QtspClauses } from "../../qtsp";
import { CreateSignatureRequest as CreateQtspSignatureRequest } from "../../infra/namirial/signature-request";

import { InsertSignature, newSignature } from "../../signature";
import { EnqueueMessage } from "../../infra/azure/storage/queue";
import { DocumentToSign } from "../../signature-field";
import { GetSignatureRequest } from "../../signature-request";
import { GetDocumentUrl } from "../../document-url";

import { mockPublicKey, mockSignature, mockSignedTos } from "./__mocks__/qtsp";

export const CreateSignaturePayload = t.type({
  signatureRequestId: NonEmptyString,
  signer: Signer,
  qtspClauses: QtspClauses,
  documentsSignature: t.array(DocumentToSign),
  email: EmailString,
  spidAssertion: NonEmptyString,
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
          ),
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
    enqueueSignature: EnqueueMessage,
    getSignatureRequest: GetSignatureRequest,
    getDownloadDocumentUrl: GetDocumentUrl,
    getUploadSignedDocumentUrl: GetDocumentUrl
  ) =>
  ({
    signatureRequestId,
    signer,
    qtspClauses,
    documentsSignature,
    email,
    spidAssertion,
  }: CreateSignaturePayload) => {
    const getDocumentUrlForSignature = pipe(
      signatureRequestId,
      makeGetDocumentUrlForSignature(
        getSignatureRequest,
        getDownloadDocumentUrl,
        getUploadSignedDocumentUrl
      )(signer.id)
    );

    return pipe(
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
                signatureFields: documentSignature.signatureFields,
              }))
            )
          ),
          A.sequence(TE.ApplicativeSeq)
        ),
      }),

      TE.map(({ fiscalCode, documentsToSign }) => ({
        fiscalCode,
        publicKey: mockPublicKey,
        spidAssertion,
        email,
        documentLink: qtspClauses.filledDocumentUrl,
        tosSignature: mockSignedTos,
        signature: mockSignature,
        nonce: qtspClauses.nonce,
        documentsToSign,
      })),
      TE.chain(creatQtspSignatureRequest),
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
      TE.chainFirst((signature) =>
        pipe(
          {
            signatureId: signature.id,
            signerId: signature.signerId,
          },
          JSON.stringify,
          enqueueSignature
        )
      )
    );
  };
