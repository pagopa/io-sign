import { Issuer } from "@io-sign/io-sign/issuer";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "io-ts/lib/Encoder";
import * as S from "fp-ts/lib/string";
import { pipe } from "fp-ts/lib/function";
import { newId } from "@io-sign/io-sign/id";
import { IoSignContract } from "./contract";

export const ioSignContractToIssuer: E.Encoder<Issuer, IoSignContract> = {
  encode: ({ internalIstitutionID, institution }) => ({
    id: newId(),
    // See [IO-SIGN-RFC-SUB-ID]
    subscriptionId: pipe(
      S.Monoid.concat("TEMP-", institution.taxCode)
    ) as NonEmptyString,
    internalInstitutionId: internalIstitutionID,
    // TODO: [SFEQS-1486] This email must be replaced with the support-mail of the issuer not yet on self-care
    email: institution.digitalAddress,
    description: institution.description,
    // Initially all newly created issuer will be in a test phase.
    environment: "TEST",
  }),
};
