import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/lib/Record";
import { sequenceS } from "fp-ts/lib/Apply";

import { Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { Document, DocumentId, DocumentReady } from "@io-sign/io-sign/document";
import { GetDocumentContent } from "@io-sign/io-sign/document-content";
import { getDocumentContent } from "@io-sign/io-sign/infra/azure/storage/document-content";
import { bufferResponse } from "@io-sign/io-sign/infra/http/response";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { makeGetSignatureRequest } from "../../azure/cosmos/signature-request";
import { requireSignatureRequestId } from "../decoders/signature-request";
import { makeGetSignedDocumentContent } from "../../../app/use-cases/get-signed-document-content";
import { requireFiscalCode } from "../decoders/fiscal-code";

const requireDocumentId = (
  req: H.HttpRequest
): E.Either<Error, Document["id"]> =>
  pipe(
    req.path,
    lookup("documentId"),
    E.fromOption(
      () => new H.HttpBadRequestError(`Missing "documentId" in path`)
    ),
    E.chainW(H.parse(DocumentId, `Invalid "documentId" supplied`))
  );

export type GetThirdPartyMessageAttachmentContentDependencies = {
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  db: Database;
  signedContainerClient: ContainerClient;
};

export const GetThirdPartyMessageAttachmentContentHandler = H.of(
  (req: H.HttpRequest) =>
    pipe(
      sequenceS(RTE.ApplyPar)({
        fiscalCode: RTE.fromEither(requireFiscalCode(req)),
        signatureRequestId: requireSignatureRequestId(req),
        documentId: RTE.fromEither(requireDocumentId(req))
      }),
      RTE.chainW(
        ({ fiscalCode, signatureRequestId, documentId }) =>
          ({
            pdvTokenizerClient,
            db,
            signedContainerClient
          }: GetThirdPartyMessageAttachmentContentDependencies) => {
            const getSignerByFiscalCode =
              makeGetSignerByFiscalCode(pdvTokenizerClient);
            const getSignatureRequest = makeGetSignatureRequest(db);
            const getDocumenContent: GetDocumentContent = (
              document: DocumentReady
            ) => pipe(document, getDocumentContent)(signedContainerClient);
            const getSignedDocumentContent =
              makeGetSignedDocumentContent(getDocumenContent);

            return pipe(
              fiscalCode,
              getSignerByFiscalCode,
              TE.chain(
                TE.fromOption(
                  () =>
                    new EntityNotFoundError(
                      "The specified signer does not exist."
                    )
                )
              ),
              TE.map((signer) => signer.id),
              TE.chain(getSignatureRequest(signatureRequestId)),
              TE.chain(
                TE.fromOption(
                  () =>
                    new EntityNotFoundError(
                      "The specified Signature Request does not exist."
                    )
                )
              ),
              TE.chain((signatureRequest) =>
                getSignedDocumentContent(signatureRequest, documentId)
              )
            );
          }
      ),
      RTE.map(bufferResponse("application/pdf")),
      RTE.orElseW(logErrorAndReturnResponse)
    )
);
