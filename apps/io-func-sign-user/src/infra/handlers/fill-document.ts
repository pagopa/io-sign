import * as H from "@pagopa/handler-kit";

import { SignerRepository } from "@io-sign/io-sign/signer";
import { ContainerClient } from "@azure/storage-blob";
import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";

import { makeUploadBlob } from "../azure/storage/blob";
import { makeFillDocument } from "../../app/use-cases/fill-document";
import { FillDocumentPayload } from "../../filled-document";

export type FillDocumentDependencies = {
  signerRepository: SignerRepository;
  filledContainerClient: ContainerClient;
};

export const FillDocumentHandler = H.of(
  (payload: FillDocumentPayload) =>
    ({ signerRepository, filledContainerClient }: FillDocumentDependencies) => {
      const fillDocument = makeFillDocument(
        signerRepository,
        makeUploadBlob(filledContainerClient),
        makeFetchWithTimeout()
      );
      return fillDocument(payload);
    }
);
