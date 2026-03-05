import * as H from "@pagopa/handler-kit";

import { Database } from "@azure/cosmos";
import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest
} from "../azure/cosmos/signature-request";
import { makeMarkRequestAsWaitForSignature } from "../../app/use-cases/mark-request-wait-for-signature";

export type MarkAsWaitForSignatureEnvironment = {
  db: Database;
};

export const MarkAsWaitForSignatureHandler = H.of(
  (payload: SignatureRequestToBeSigned) =>
    ({ db }: MarkAsWaitForSignatureEnvironment) =>
      makeMarkRequestAsWaitForSignature(
        makeGetSignatureRequest(db),
        makeUpsertSignatureRequest(db)
      )(payload)
);
