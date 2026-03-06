import * as H from "@pagopa/handler-kit";

import { Database } from "@azure/cosmos";
import { QueueClient } from "@azure/storage-queue";

import {
  GenerateSignatureRequestQrCode,
  SignatureRequestReady
} from "@io-sign/io-sign/signature-request";

import { makeUpsertSignatureRequest } from "../azure/cosmos/signature-request";
import { makeNotifySignatureRequestWaitForSignatureEvent } from "../azure/storage/signature-request";
import { makeCreateSignatureRequest } from "../../app/use-cases/create-signature-request";

export type CreateSignatureRequestDependencies = {
  db: Database;
  onWaitForSignatureQueueClient: QueueClient;
  generateSignatureRequestQrCode: GenerateSignatureRequestQrCode;
};

export const CreateSignatureRequestHandler = H.of(
  (signatureRequest: SignatureRequestReady) =>
    ({
      db,
      onWaitForSignatureQueueClient,
      generateSignatureRequestQrCode
    }: CreateSignatureRequestDependencies) => {
      const createSignatureRequest = makeCreateSignatureRequest(
        makeUpsertSignatureRequest(db),
        makeNotifySignatureRequestWaitForSignatureEvent(
          onWaitForSignatureQueueClient
        ),
        generateSignatureRequestQrCode
      );
      return createSignatureRequest(signatureRequest);
    }
);
