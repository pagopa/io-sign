import { createHandler } from "handler-kit-legacy";
import * as azure from "handler-kit-legacy/lib/azure";

import { created, error } from "@io-sign/io-sign/infra/http/response";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe, flow } from "fp-ts/lib/function";
import { HttpRequest, withHeader } from "handler-kit-legacy/lib/http";

import { sequenceS } from "fp-ts/lib/Apply";
import { validate } from "@io-sign/io-sign/validation";

import { ContainerClient } from "@azure/storage-blob";

import { QueueClient } from "@azure/storage-queue";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { ValidUrl } from "@pagopa/ts-commons/lib/url";
import {
  defaultBlobGenerateSasUrlOptions,
  generateSasUrlFromBlob,
  withPermissions,
  withExpireInMinutes,
  getBlobClient,
  deleteBlobIfExist,
} from "@io-sign/io-sign/infra/azure/storage/blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { makeCreateFilledDocumentUrl } from "../../../app/use-cases/create-filled-document";
import { requireSigner } from "../../http/decoders/signer.old";
import { CreateFilledDocumentBody } from "../../http/models/CreateFilledDocumentBody";
import { FilledDocumentToApiModel } from "../../http/encoders/filled-document";
import { FilledDocumentDetailView } from "../../http/models/FilledDocumentDetailView";
import { makeNotifyDocumentToFill } from "../storage/document-to-fill";
import { CreateFilledDocumentPayload } from "../../../filled-document";

export type GetFilledDocumentUrl = (
  filledDocumentBlobName: string,
) => TE.TaskEither<Error, string>;

const makeCreateFilledDocumentHandler = (
  filledContainerClient: ContainerClient,
  documentsToFillQueue: QueueClient,
  tokenizer: PdvTokenizerClientWithApiKey,
) => {
  const notifyDocumentToFill = makeNotifyDocumentToFill(documentsToFillQueue);
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);

  const getFilledDocumentUrl: GetFilledDocumentUrl = (
    filledDocumentBlobName: string,
  ) =>
    pipe(
      filledDocumentBlobName,
      getBlobClient,
      RTE.chainFirstTaskEitherK((blobClient) =>
        pipe(
          blobClient,
          deleteBlobIfExist,
          // if the file doesn't exist I can proceed anyway
          TE.alt(() => TE.right(blobClient)),
        ),
      ),
      RTE.chainTaskEitherK(
        generateSasUrlFromBlob(
          pipe(
            defaultBlobGenerateSasUrlOptions(),
            withPermissions("r"),
            withExpireInMinutes(120),
          ),
        ),
      ),
    )(filledContainerClient);

  const createFilledDocumentUrl = makeCreateFilledDocumentUrl(
    getFilledDocumentUrl,
    notifyDocumentToFill,
    getFiscalCodeBySignerId,
  );

  const requireCreateFilledDocumentBody = flow(
    (req: HttpRequest) => req.body,
    validate(CreateFilledDocumentBody),
    E.map((body) => ({
      documentUrl: body.document_url,
      email: body.email,
      familyName: body.family_name,
      name: body.name,
    })),
  );

  const requireCreateFilledDocumentPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    CreateFilledDocumentPayload
  > = pipe(
    sequenceS(RTE.ApplyPar)({
      signer: RTE.fromReaderEither(requireSigner),
      body: RTE.fromReaderEither(requireCreateFilledDocumentBody),
    }),
    RTE.map(({ signer, body: { documentUrl, email, familyName, name } }) => ({
      signer,
      // TODO: [SFEQS-1237] workaround for WAF
      documentUrl: documentUrl.includes("https://")
        ? documentUrl
        : pipe(
            E.tryCatch(
              () => Buffer.from(documentUrl, "base64").toString(),
              E.toError,
            ),
            E.chainW(
              validate(NonEmptyString, "Invalid encoded filledDocumentUrl"),
            ),
            E.getOrElse(() => documentUrl),
          ),
      email,
      familyName,
      name,
    })),
  );

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireCreateFilledDocumentPayload),
  );

  const encodeHttpSuccessResponse = (response: { url: ValidUrl }) =>
    pipe(
      response,
      FilledDocumentToApiModel.encode,
      created(FilledDocumentDetailView),
      withHeader("Location", response.url.href),
    );

  return createHandler(
    decodeHttpRequest,
    createFilledDocumentUrl,
    error,
    encodeHttpSuccessResponse,
  );
};

export const makeCreateFilledDocumentFunction = (
  filledContainerClient: ContainerClient,
  documentsToFillQueue: QueueClient,
  pdvTokenizerClient: PdvTokenizerClientWithApiKey,
) =>
  pipe(
    makeCreateFilledDocumentHandler(
      filledContainerClient,
      documentsToFillQueue,
      pdvTokenizerClient,
    ),
    azure.unsafeRun,
  );
