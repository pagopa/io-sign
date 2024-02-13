import { Issuer } from "@io-sign/io-sign/issuer";
import * as E from "io-ts/lib/Encoder";
import { newId } from "@io-sign/io-sign/id";
import { IoSignContractWithSupportMail } from "./contract";

// Create an Issuer entity from a self-care contract
export const ioSignContractToIssuer: E.Encoder<
  Issuer,
  IoSignContractWithSupportMail
> = {
  encode: ({ internalIstitutionID, institution, supportEmail, billing }) => ({
    id: newId(),
    subscriptionId: newId(),
    internalInstitutionId: internalIstitutionID,
    email: supportEmail,
    description: institution.description,
    // Initially all newly created issuer will be in a test phase.
    environment: "TEST",
    vatNumber: billing.vatNumber,
    taxCode: institution.taxCode,
    department: "",
    status: "ACTIVE",
  }),
};
