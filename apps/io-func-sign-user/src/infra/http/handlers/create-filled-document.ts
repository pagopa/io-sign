import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { pipe } from "fp-ts/lib/function";

import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import {
  defaultBlobGenerateSasUrlOptions,
  deleteBlobIfExist,
  generateSasUrlFromBlob,
  getBlobClient,
  withExpireInMinutes,
  withPermissions
} from "@io-sign/io-sign/infra/azure/storage/blob";

import { makeCreateFilledDocumentUrl } from "../../../app/use-cases/create-filled-document";
import { makeNotifyDocumentToFill } from "../../azure/storage/document-to-fill";
import { requireSigner } from "../decoders/signer";
import { CreateFilledDocumentBody } from "../models/CreateFilledDocumentBody";
import { FilledDocumentToApiModel } from "../encoders/filled-document";

type GetFilledDocumentUrl = (
  filledDocumentBlobName: string
) => TE.TaskEither<Error, string>;

type CreateFilledDocumentsDependencies = {
  filledContainerClient: ContainerClient;
  documentsToFillQueue: QueueClient;
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
};

const requirePayload = (req: H.HttpRequest) =>
  pipe(
    req.body,
    H.parse(CreateFilledDocumentBody),
    E.mapLeft((e): Error => e),
    E.chainW((body) =>
      pipe(
        requireSigner(req),
        E.map((signer) => ({
          signer,
          // TODO: [SFEQS-1237] workaround for WAF — URLs may arrive base64-encoded
          documentUrl: body.document_url.includes("https://")
            ? body.document_url
            : pipe(
                E.tryCatch(
                  () => Buffer.from(body.document_url, "base64").toString(),
                  E.toError
                ),
                E.chainW(
                  H.parse(NonEmptyString, "Invalid encoded filledDocumentUrl")
                ),
                E.getOrElse((): NonEmptyString => body.document_url)
              ),
          email: body.email,
          familyName: body.family_name,
          name: body.name
        }))
      )
    )
  );

const makeGetFilledDocumentUrl =
  (filledContainerClient: ContainerClient): GetFilledDocumentUrl =>
  (filledDocumentBlobName: string) =>
    pipe(
      filledDocumentBlobName,
      getBlobClient,
      RTE.chainFirstTaskEitherK((blobClient) =>
        pipe(
          blobClient,
          deleteBlobIfExist,
          // if the file doesn't exist we can proceed anyway
          TE.alt(() => TE.right(blobClient))
        )
      ),
      RTE.chainTaskEitherK(
        generateSasUrlFromBlob(
          pipe(
            defaultBlobGenerateSasUrlOptions(),
            withPermissions("r"),
            withExpireInMinutes(120)
          )
        )
      )
    )(filledContainerClient);

export const CreateFilledDocumentHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(requirePayload(req)),
    RTE.chainW(
      (payload) =>
        ({
          filledContainerClient,
          documentsToFillQueue,
          pdvTokenizerClient
        }: CreateFilledDocumentsDependencies) => {
          const getFilledDocumentUrl = makeGetFilledDocumentUrl(
            filledContainerClient
          );

          const notifyDocumentToFill =
            makeNotifyDocumentToFill(documentsToFillQueue);
          const getFiscalCodeBySignerId =
            makeGetFiscalCodeBySignerId(pdvTokenizerClient);

          return makeCreateFilledDocumentUrl(
            getFilledDocumentUrl,
            notifyDocumentToFill,
            getFiscalCodeBySignerId
          )(payload);
        }
    ),
    RTE.map((filledDocument) =>
      pipe(
        filledDocument,
        FilledDocumentToApiModel.encode,
        H.successJson,
        H.withStatusCode(201),
        H.withHeader("Location", filledDocument.url.href)
      )
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
