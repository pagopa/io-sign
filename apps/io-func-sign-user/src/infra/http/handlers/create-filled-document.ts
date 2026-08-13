import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { sequenceS } from "fp-ts/lib/Apply";

import { pipe } from "fp-ts/lib/function";

import { ContainerClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import {
  getSignerByFiscalCode,
  SignerRepository
} from "@io-sign/io-sign/signer";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { GetValidatedEmailByFiscalCode } from "@io-sign/io-sign/infra/io-profile/profile";
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
import { requireFiscalCode } from "../decoders/fiscal-code";
import { requireFamilyName, requireName } from "../decoders/user-identity";
import { CreateFilledDocumentBody } from "../models/CreateFilledDocumentBody";
import { FilledDocumentToApiModel } from "../encoders/filled-document";

type CreateFilledDocumentsDependencies = {
  filledContainerClient: ContainerClient;
  documentsToFillQueue: QueueClient;
  signerRepository: SignerRepository;
  getValidatedEmailByFiscalCode: GetValidatedEmailByFiscalCode;
};

type GetFilledDocumentUrl = (
  filledDocumentBlobName: string
) => TE.TaskEither<Error, string>;

// TODO: [SFEQS-1237] workaround for WAF — URLs may arrive base64-encoded
const decodeDocumentUrl = (documentUrl: NonEmptyString) =>
  documentUrl.includes("https://")
    ? documentUrl
    : pipe(
        E.tryCatch(
          () => Buffer.from(documentUrl, "base64").toString(),
          E.toError
        ),
        E.chainW(H.parse(NonEmptyString, "Invalid encoded filledDocumentUrl")),
        E.getOrElse((): NonEmptyString => documentUrl)
      );

const requireDocumentUrl = (req: H.HttpRequest) =>
  pipe(
    req.body,
    H.parse(CreateFilledDocumentBody),
    E.mapLeft((e) => new H.HttpBadRequestError(e.message)),
    E.map((body) => decodeDocumentUrl(body.document_url))
  );

const toErrorRetrievingTheSignerId = new Error(
  "Error retrieving the signer id for this user"
);

const toErrorRetrievingUserProfile = new Error(
  "Error retrieving a user profile with validated email address"
);

const requirePayload = (req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(
      sequenceS(E.Apply)({
        documentUrl: requireDocumentUrl(req),
        name: requireName(req),
        familyName: requireFamilyName(req),
        fiscalCode: requireFiscalCode(req)
      })
    ),
    RTE.bindW("signer", ({ fiscalCode }) =>
      pipe(
        getSignerByFiscalCode(fiscalCode),
        RTE.mapLeft(() => toErrorRetrievingTheSignerId)
      )
    ),
    RTE.bindW(
      "email",
      ({ fiscalCode }) =>
        (r: { getValidatedEmailByFiscalCode: GetValidatedEmailByFiscalCode }) =>
          pipe(
            r.getValidatedEmailByFiscalCode(fiscalCode),
            TE.mapLeft(() => toErrorRetrievingUserProfile)
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
    requirePayload(req),
    RTE.chainW(
      (payload) =>
        ({
          filledContainerClient,
          documentsToFillQueue,
          signerRepository
        }: CreateFilledDocumentsDependencies) => {
          const getFilledDocumentUrl = makeGetFilledDocumentUrl(
            filledContainerClient
          );

          const notifyDocumentToFill =
            makeNotifyDocumentToFill(documentsToFillQueue);

          return makeCreateFilledDocumentUrl(
            getFilledDocumentUrl,
            notifyDocumentToFill,
            signerRepository
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
