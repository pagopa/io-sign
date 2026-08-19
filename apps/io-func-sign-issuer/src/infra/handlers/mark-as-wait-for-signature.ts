import * as H from "@pagopa/handler-kit";

import { Database } from "@azure/cosmos";
import { SignatureRequestToBeSigned } from "@io-sign/io-sign/signature-request";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest
} from "../azure/cosmos/signature-request";
import { makeMarkRequestAsWaitForSignature } from "../../app/use-cases/mark-request-wait-for-signature";
import { SignEventsProducerClient } from "@io-sign/io-sign/sign-event";
import { makeCreateAndSendSignEvent } from "@io-sign/io-sign/infra/azure/event-hubs/sign-event";

export type MarkAsWaitForSignatureEnvironment = {
  db: Database;
  signEventsClient: SignEventsProducerClient;
};

export const MarkAsWaitForSignatureHandler = H.of(
  (payload: SignatureRequestToBeSigned) =>
    ({ db, signEventsClient }: MarkAsWaitForSignatureEnvironment) =>
      makeMarkRequestAsWaitForSignature(
        makeGetSignatureRequest(db),
        makeUpsertSignatureRequest(db),
        makeCreateAndSendSignEvent(signEventsClient)
      )(payload)
);
