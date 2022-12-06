import { GetFiscalCodeBySignerId, Signer } from "@io-sign/io-sign/signer";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { DocumentToSign } from "../../document-to-sign";

import { QtspClauses } from "../../qtsp";
import { CreateSignatureRequest } from "../../infra/namirial/signature-request";
import { QtspCreateSignatureToApiModel } from "../../infra/namirial/encoders/signature-request";

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
    signatureRequestId,
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
          urlIn:
            "https://iosigndev.blob.core.windows.net/signed-documents/test.pdf?sp=racw&st=2022-11-24T11:15:33Z&se=2022-12-31T19:15:33Z&spr=https&sv=2021-06-08&sr=c&sig=dhLJOk87phN7qY8CYNFJkPMiO7wODiKu4X7alYqncvo%3D" as NonEmptyString,
          urlOut:
            "https://iosigndev.blob.core.windows.net/signed-documents/test-signed.pdf?sp=racw&st=2022-11-24T11:15:33Z&se=2022-12-31T19:15:33Z&spr=https&sv=2021-06-08&sr=c&sig=dhLJOk87phN7qY8CYNFJkPMiO7wODiKu4X7alYqncvo%3D" as NonEmptyString,
          signatureFields: el.signatureFields,
        })),
      })),
      TE.chain(creatQtspSignatureRequest)
    );
