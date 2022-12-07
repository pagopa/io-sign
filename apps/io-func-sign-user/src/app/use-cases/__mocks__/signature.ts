/* eslint-disable @typescript-eslint/no-explicit-any */
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Signature } from "../../../signature";

export const aSignature: Signature = {
  id: "id" as NonEmptyString,
  createdAt: new Date(),
  signerId: "signerId" as NonEmptyString,
  qtspSignatureRequestId: "qtspSignatureRequestId" as NonEmptyString,
  updatedAt: new Date(),
  status: "CREATED" as any,
  signatureRequestId: "signatureRequestId" as NonEmptyString,
};
