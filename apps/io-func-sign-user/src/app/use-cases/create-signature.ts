import { GetFiscalCodeBySignerId, Signer } from "@io-sign/io-sign/signer";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { DocumentToSign } from "../../document-to-sign";

import { QtspClauses } from "../../qtsp";
import { CreateSignatureRequest } from "../../infra/namirial/signature-request";

import {
  mockPublicKey,
  mockSignature,
  mockSignedTos,
  mockSpidAssertion,
} from "./__mocks__/qtsp";

export const CreateSignaturePayload = t.type({
  signatureRequestId: NonEmptyString,
  signer: Signer,
  qtspClauses: QtspClauses,
  documentsSignature: t.array(DocumentToSign),
  email: EmailString,
});

export type CreateSignaturePayload = t.TypeOf<typeof CreateSignaturePayload>;

export const makeCreateSignature =
  (
    getFiscalCodeBySignerId: GetFiscalCodeBySignerId,
    creatQtspSignatureRequest: CreateSignatureRequest
  ) =>
  ({
    signer,
    qtspClauses,
    documentsSignature,
    email,
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
        spidAssertion: mockSpidAssertion,
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
      TE.chain(creatQtspSignatureRequest)
    );
