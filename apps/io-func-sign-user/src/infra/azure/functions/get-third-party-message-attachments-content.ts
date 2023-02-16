import { flow, pipe } from "fp-ts/lib/function";

import { sequenceS } from "fp-ts/lib/Apply";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";
import { HttpRequest, path } from "@pagopa/handler-kit/lib/http";

import { Database } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { error } from "@io-sign/io-sign/infra/http/response";
import { validate } from "@io-sign/io-sign/validation";
import { Document, DocumentReady } from "@io-sign/io-sign/document";
import { DocumentId } from "@io-sign/io-sign/document";
import { GetDocumentContent } from "@io-sign/io-sign/document-content";
import { getDocumentContent } from "@io-sign/io-sign/infra/azure/storage/document-content";

import { makeGetSignatureRequest } from "../cosmos/signature-request";
import { makeRequireSignatureRequestByFiscalCode } from "../../http/decoder/signature-request";

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
    (buffer) => ({
      // body must be of type string, but buffer.toString appends some extra characters which corrupt the final file even with byte-encoding.
      body: buffer as unknown as string,
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": Buffer.byteLength(buffer).toString(),
      },
    })
  );
};

export const makeGetThirdPartyMessageAttachmentContentFunction = flow(
  makeGetThirdPartyMessageAttachmentContentHandler,
  azure.unsafeRun
);
