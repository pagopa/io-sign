// This Azure Function checks if a "PDF DOCUMENT" is a valid "DOCUMENT" according
// to the business rules of io-sign.
// Unlike "ValidateDocument", this function is called, in an async job, for each upload to
// Azure Blob Storage.
//
// In v4, app.storageBlob delivers the raw blob Buffer as the first argument.
// We pass it directly to the use case, avoiding a redundant re-download.

import { InvocationContext } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as H from "@pagopa/handler-kit";

import {
  FileStorage,
  UploadMetadata,
  UploadMetadataRepository
} from "../../../upload";
import { validateUpload } from "../../../app/use-cases/validate-upload";
import { makeLogger } from "./logger";
import { SignatureRequestRepository } from "../../../signature-request";
import { EventProducerClient } from "@io-sign/io-sign/event";

type ValidateUploadDeps = {
  uploadMetadataRepository: UploadMetadataRepository;
  signatureRequestRepository: SignatureRequestRepository;
  uploadedFileStorage: FileStorage;
  validatedFileStorage: FileStorage;
  eventAnalyticsClient: EventProducerClient;
};

export const makeValidateUploadBlobHandler =
  (deps: ValidateUploadDeps) =>
  async (blob: Buffer, context: InvocationContext): Promise<void> => {
    const name = context.triggerMetadata?.name;
    const idResult = pipe(
      typeof name === "string" ? name : "",
      H.parse(UploadMetadata.types[0].props.id, "invalid blob name")
    );
    if (E.isLeft(idResult)) {
      context.error(`validateUpload: invalid blob name "${name}"`);
      return;
    }
    await validateUpload(
      idResult.right,
      blob
    )({
      ...deps,
      logger: makeLogger(context)
    })();
  };
