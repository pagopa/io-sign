import { Issuer } from "@io-sign/io-sign/issuer";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "io-ts/lib/Encoder";
import * as S from "fp-ts/lib/string";
import { pipe } from "fp-ts/lib/function";
import { newId } from "@io-sign/io-sign/id";
import { IoSignContractWithSupportMail } from "./contract";

// Create an Issuer entity from a self-care contract
export const ioSignContractToIssuer: E.Encoder<
  Issuer,
  IoSignContractWithSupportMail
> = {
  encode: ({ internalIstitutionID, institution, supportEmail }) => ({
    id: newId(),
    /* Temporarily the subscriptionId is associated with the VAT number of the issuer by prepending the string "TEMP-".
     * See: [IO-SIGN-RFC-SUB-ID]
     */
    subscriptionId: pipe(
      S.Monoid.concat("TEMP-", institution.taxCode)
    ) as NonEmptyString,
    internalInstitutionId: internalIstitutionID,
    email: supportEmail,
    description: institution.description,
    // Initially all newly created issuer will be in a test phase.
    environment: "TEST",
    vatNumber: institution.vatNumber,
    taxCode: institution.taxCode,
  }),
};
