import { flow, pipe } from "fp-ts/lib/function";

import { sequenceS } from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import * as azure from "handler-kit-legacy/lib/azure";
import { createHandler } from "handler-kit-legacy";
import { HttpRequest, path } from "handler-kit-legacy/lib/http";

import { Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { error, successBuffer } from "@io-sign/io-sign/infra/http/response";
import { validate } from "@io-sign/io-sign/validation";
import { Document, DocumentReady } from "@io-sign/io-sign/document";
import { DocumentId } from "@io-sign/io-sign/document";
import { GetDocumentContent } from "@io-sign/io-sign/document-content";
import { getDocumentContent } from "@io-sign/io-sign/infra/azure/storage/document-content";

import { makeGetSignatureRequest } from "../cosmos/signature-request";
import { makeRequireSignatureRequestByFiscalCode } from "../../http/decoders/signature-request";

import { SignatureRequest } from "../../../signature-request";
import { makeGetSignedDocumentContent } from "../../../app/use-cases/get-signed-document-content";

export type GetAttachmentPayload = {
  signatureRequest: SignatureRequest;
  documentId: Document["id"];
};

const makeGetThirdPartyMessageAttachmentContentHandler = (
  pdvTokenizerClientWithApiKey: PdvTokenizerClientWithApiKey,
  db: Database,
  signedContainerClient: ContainerClient
) => {
  const getSignerByFiscalCode = makeGetSignerByFiscalCode(
    pdvTokenizerClientWithApiKey
  );

  const getSignatureRequest = makeGetSignatureRequest(db);

  const requireDocumentIdFromPath = flow(
    path("documentId"),
    E.fromOption(() => new Error(`missing "documentId" in path`)),
    E.chainW(validate(DocumentId, `invalid "documentId" supplied`))
  );

  const getDocumenContent: GetDocumentContent = (document: DocumentReady) =>
    pipe(document, getDocumentContent)(signedContainerClient);

  const getSignedDocumentContent =
    makeGetSignedDocumentContent(getDocumenContent);

  const requireGetAttachmentPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    GetAttachmentPayload
  > = sequenceS(RTE.ApplyPar)({
    signatureRequest: flow(
      makeRequireSignatureRequestByFiscalCode(
        getSignatureRequest,
        getSignerByFiscalCode
      )
    ),
    documentId: RTE.fromReaderEither(requireDocumentIdFromPath),
  });

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireGetAttachmentPayload)
  );

  return createHandler(
    decodeHttpRequest,
    ({ signatureRequest, documentId }) =>
      getSignedDocumentContent(signatureRequest, documentId),
    error,
    successBuffer("application/pdf")
  );
};

export const makeGetThirdPartyMessageAttachmentContentFunction = flow(
  makeGetThirdPartyMessageAttachmentContentHandler,
  azure.unsafeRun
);
