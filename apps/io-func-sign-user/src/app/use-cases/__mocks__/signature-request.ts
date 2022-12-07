/* eslint-disable @typescript-eslint/no-explicit-any */
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { SignatureRequest } from "../../../infra/namirial/types/signature-request";

export const aSignatureRequest: SignatureRequest = {
  id: "id" as NonEmptyString,
  created_at: new Date(),
  status: "CREATED" as any,
  last_error: {
    code: 1,
    detail: "detail" as NonEmptyString,
  },
};
