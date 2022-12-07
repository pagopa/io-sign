import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { CreateSignaturePayload } from "../create-signature";

export const aCreateSignaturePayload: CreateSignaturePayload = {
  signatureRequestId: "signatureRequestId" as NonEmptyString,
  signer: {
    id: "signerId" as NonEmptyString,
  },
  qtspClauses: {
    acceptedClauses: [],
    nonce: "nonce" as NonEmptyString,
    filledDocumentUrl: "filledDocumentUrl" as NonEmptyString,
  },
  documentsSignature: [],
  email: "email" as EmailString,
};
