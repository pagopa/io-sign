import { GetFiscalCodeBySignerId, Signer } from "@io-sign/io-sign/signer";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import {
  ActionNotAllowedError,
  EntityNotFoundError,
} from "@io-sign/io-sign/error";

import { QtspClauses } from "../../qtsp";
import { CreateSignatureRequest as CreateQtspSignatureRequest } from "../../infra/namirial/signature-request";

import { InsertSignature, newSignature } from "../../signature";
import { EnqueueMessage } from "../../infra/azure/storage/queue";
import { DocumentToSign } from "../../signature-field";
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

/** Send a signature request to QTSP, create the Signature entity
 *  and enqueue Signature for future validation
 */
export const makeCreateSignature =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    creatQtspSignatureRequest: CreateQtspSignatureRequest,
    insertSignature: InsertSignature,
    enqueueSignature: EnqueueMessage
  ) =>
  ({
    signatureRequestId,
    signer,
    qtspClauses,
    documentsSignature,
    email,
    spidAssertion,
  }: CreateSignaturePayload) =>
    pipe(
      signer.id,
      getFiscalCodeBySignerId,
      TE.chain(
        TE.fromOption(
          () =>
            new EntityNotFoundError("Fiscal code not found for this signer!")
        )
      ),
      TE.map((fiscalCode) => ({
        fiscalCode,
        publicKey: mockPublicKey,
        spidAssertion,
        email,
        documentLink: qtspClauses.filledDocumentUrl,
        tosSignature: mockSignedTos,
        signature: mockSignature,
        nonce: qtspClauses.nonce,
        documentsToSign: documentsSignature.map((el) => ({
          urlIn: "https://mockedurl.com/test.pdf" as NonEmptyString,
          urlOut: "https://mockedurl.com/test-signed.pdf" as NonEmptyString,
          signatureFields: el.signatureFields,
        })),
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
