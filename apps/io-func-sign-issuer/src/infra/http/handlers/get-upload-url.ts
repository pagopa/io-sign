import * as H from "@pagopa/handler-kit";

import * as t from "io-ts";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import { lookup } from "fp-ts/lib/Record";

import { Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";

import { DocumentId } from "@io-sign/io-sign/document";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { IssuerRepository } from "../../../issuer";
import { makeGetSignatureRequest } from "../../azure/cosmos/signature-request";
import { makeGetUploadUrl as makeGetUploadUrlUseCase } from "../../../app/use-cases/get-upload-url";
import { makeInsertUploadMetadata } from "../../azure/cosmos/upload";
import { makeGetUploadUrl } from "../../azure/storage/upload";
import { UploadUrlToApiModel } from "../encoders/upload";
import { requireIssuer } from "../decoders/issuer";
import { requireSignatureRequestId } from "../decoders/signature-request";

type GetUploadUrlDependencies = {
  db: Database;
  uploadedContainerClient: ContainerClient;
  issuerRepository: IssuerRepository;
};

const requireDocumentId = (
  req: H.HttpRequest
): E.Either<Error, t.TypeOf<typeof DocumentId>> =>
  pipe(
    req.path,
    lookup("documentId"),
    E.fromOption(
      () => new H.HttpBadRequestError(`Missing "documentId" in path`)
    ),
    E.chainW(H.parse(DocumentId, `Invalid "documentId" supplied`))
  );

export const GetUploadUrlHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      signatureRequestId: requireSignatureRequestId(req),
      issuer: requireIssuer(req),
      documentId: RTE.fromEither(requireDocumentId(req))
    }),
    RTE.chainW(
      ({ signatureRequestId, issuer, documentId }) =>
        ({ db, uploadedContainerClient }: GetUploadUrlDependencies) =>
          pipe(
            makeGetSignatureRequest(db)(signatureRequestId)(issuer.id),
            TE.chain(
              TE.fromOption(
                () =>
                  new EntityNotFoundError(
                    "The specified Signature Request does not exist."
                  )
              )
            ),
            TE.chain((signatureRequest) =>
              makeGetUploadUrlUseCase(
                makeInsertUploadMetadata(db),
                makeGetUploadUrl(uploadedContainerClient)
              )({ signatureRequest, documentId })
            )
          )
    ),
    RTE.map(flow(UploadUrlToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
