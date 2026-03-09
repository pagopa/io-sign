import * as H from "@pagopa/handler-kit";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { ContainerClient } from "@azure/storage-blob";
import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";

import { makeUploadBlob } from "../azure/storage/blob";
import { makeFillDocument } from "../../app/use-cases/fill-document";
import { FillDocumentPayload } from "../../filled-document";

export type FillDocumentDependencies = {
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  filledContainerClient: ContainerClient;
};

export const FillDocumentHandler = H.of(
  (payload: FillDocumentPayload) =>
    ({
      pdvTokenizerClient,
      filledContainerClient
    }: FillDocumentDependencies) => {
      const fillDocument = makeFillDocument(
        makeGetFiscalCodeBySignerId(pdvTokenizerClient),
        makeUploadBlob(filledContainerClient),
        makeFetchWithTimeout()
      );
      return fillDocument(payload);
    }
);
