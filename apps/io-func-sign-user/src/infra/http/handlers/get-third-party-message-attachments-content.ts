import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/lib/Record";
import { sequenceS } from "fp-ts/lib/Apply";

import { Database } from "@azure/cosmos";
import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

import { SignerRepository } from "@io-sign/io-sign/signer";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { Document, DocumentId, DocumentReady } from "@io-sign/io-sign/document";
import { GetDocumentContent } from "@io-sign/io-sign/document-content";
import { getDocumentContentWithFallback } from "@io-sign/io-sign/infra/azure/storage/blob-storage-with-fallback";
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
  signerRepository: SignerRepository;
  db: Database;
  signedContainerClient: BaseContainerClientWithFallback;
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
            signerRepository,
            db,
            signedContainerClient
          }: GetThirdPartyMessageAttachmentContentDependencies) => {
            const getSignatureRequest = makeGetSignatureRequest(db);
            const getDocumentContent: GetDocumentContent = (
              document: DocumentReady
            ) =>
              getDocumentContentWithFallback(document)(signedContainerClient);
            const getSignedDocumentContent =
              makeGetSignedDocumentContent(getDocumentContent);

            return pipe(
              signerRepository.getSignerByFiscalCode(fiscalCode),
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
