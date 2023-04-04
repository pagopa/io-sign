import { Database as CosmosDatabase } from "@azure/cosmos";

import { createHandler } from "handler-kit-legacy";
import * as azureLegacyHandler from "handler-kit-legacy/lib/azure";

import { HttpRequest } from "handler-kit-legacy/lib/http";

import { success, errorWithLog } from "@io-sign/io-sign/infra/http/response";
import { validate } from "@io-sign/io-sign/validation";
import { stringFromBase64Encode } from "@io-sign/io-sign/utility";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { QueueClient } from "@azure/storage-queue";
import { ContainerClient } from "@azure/storage-blob";
import { DocumentReady } from "@io-sign/io-sign/document";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { getDocumentUrl } from "@io-sign/io-sign/infra/azure/storage/document-url";
import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import { GetDocumentUrl } from "@io-sign/io-sign/document-url";
import { requireSigner } from "../../http/decoder/signer.old";
import { CreateSignatureBody } from "../../http/models/CreateSignatureBody";
import { requireDocumentsSignature } from "../../http/decoder/document-to-sign";
import { requireQtspClauses } from "../../http/decoder/qtsp-clause";

import {
  CreateSignaturePayload,
  makeCreateSignature,
} from "../../../app/use-cases/create-signature";
import { makeGetToken } from "../../namirial/client";
import { NamirialConfig } from "../../namirial/config";
import { makeCreateSignatureRequestWithToken } from "../../namirial/signature-request";

import { makeInsertSignature } from "../cosmos/signature";

import { SignatureToApiModel } from "../../http/encoders/signature";
import { SignatureDetailView } from "../../http/models/SignatureDetailView";

import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest,
} from "../cosmos/signature-request";

import { makeNotifySignatureReadyEvent } from "../storage/signature";
import { requireCreateSignatureLollipopParams } from "../../http/decoder/lollipop";
import { LollipopApiClient } from "../../lollipop/client";
import { makeGetBase64SamlAssertion } from "../../lollipop/assertion";
import { getSignatureFromHeaderName } from "../../lollipop/signature";

const makeCreateSignatureHandler = (
  tokenizer: PdvTokenizerClientWithApiKey,
  lollipopApiClient: LollipopApiClient,
  db: CosmosDatabase,
  qtspQueue: QueueClient,
  validatedContainerClient: ContainerClient,
  signedContainerClient: ContainerClient,
  qtspConfig: NamirialConfig
) => {
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const getBase64SamlAssertion = makeGetBase64SamlAssertion(lollipopApiClient);
  const getSignatureRequest = makeGetSignatureRequest(db);
  const creatQtspSignatureRequest = makeCreateSignatureRequestWithToken()(
    makeGetToken()
  )(qtspConfig);

  const insertSignature = makeInsertSignature(db);
  const upsertSignatureRequest = makeUpsertSignatureRequest(db);
  const notifySignature = makeNotifySignatureReadyEvent(qtspQueue);

  const getDownloadDocumentUrl: GetDocumentUrl = (document: DocumentReady) =>
    pipe(document, getDocumentUrl("r", 10))(validatedContainerClient);

  const getUploadSignedDocumentUrl: GetDocumentUrl = (
    document: DocumentReady
  ) => pipe(document, getDocumentUrl("racw", 10))(signedContainerClient);

  const createSignature = makeCreateSignature(
    getFiscalCodeBySignerId,
    creatQtspSignatureRequest,
    insertSignature,
    notifySignature,
    getSignatureRequest,
    getDownloadDocumentUrl,
    getUploadSignedDocumentUrl,
    upsertSignatureRequest
  );

  const requireCreateSignatureBody = flow(
    (req: HttpRequest) => req.body,
    validate(CreateSignatureBody),
    E.map((body) => ({
      email: body.email,
      signatureRequestId: body.signature_request_id,
    }))
  );

  const requireCreateSignaturePayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    CreateSignaturePayload
  > = pipe(
    sequenceS(RTE.ApplyPar)({
      signer: RTE.fromReaderEither(requireSigner),
      body: RTE.fromReaderEither(requireCreateSignatureBody),
      documentsSignature: RTE.fromReaderEither(requireDocumentsSignature),
      qtspClauses: RTE.fromReaderEither(requireQtspClauses),
      lollipopParams: RTE.fromReaderEither(
        requireCreateSignatureLollipopParams
      ),
    }),
    RTE.chainTaskEitherK((sequence) =>
      pipe(
        sequenceS(TE.ApplySeq)({
          samlAssertionBase64: getBase64SamlAssertion(sequence.lollipopParams),
          tosSignature: pipe(
            getSignatureFromHeaderName(
              sequence.lollipopParams.signatureInput,
              sequence.lollipopParams.signature,
              "x-pagopa-lollipop-custom-tos-challenge"
            ),
            TE.fromEither
          ),
          challengeSignature: pipe(
            getSignatureFromHeaderName(
              sequence.lollipopParams.signatureInput,
              sequence.lollipopParams.signature,
              "x-pagopa-lollipop-custom-sign-challenge"
            ),
            TE.fromEither
          ),
        }),
        TE.map(({ samlAssertionBase64, tosSignature, challengeSignature }) => ({
          ...sequence,
          lollipopParams: {
            ...sequence.lollipopParams,
            samlAssertionBase64,
            tosSignature,
            challengeSignature,
          },
        }))
      )
    ),
    RTE.map(
      ({
        signer,
        documentsSignature,
        qtspClauses,
        body: { email, signatureRequestId },
        lollipopParams,
      }) => ({
        signer,
        qtspClauses: {
          ...qtspClauses,
          // TODO: [SFEQS-1237] workaround for WAF
          filledDocumentUrl: qtspClauses.filledDocumentUrl.includes("https://")
            ? qtspClauses.filledDocumentUrl
            : pipe(
                qtspClauses.filledDocumentUrl,
                stringFromBase64Encode,
                E.chainW(
                  validate(NonEmptyString, "Invalid encoded filledDocumentUrl")
                ),
                E.getOrElse(() => qtspClauses.filledDocumentUrl)
              ),
        },
        documentsSignature,
        email,
        signatureRequestId,
        signatureValidationParams: {
          signatureInput: lollipopParams.signatureInput,
          publicKey: lollipopParams.publicKey,
          samlAssertionBase64: lollipopParams.samlAssertionBase64,
          tosSignature: lollipopParams.tosSignature,
          challengeSignature: lollipopParams.challengeSignature,
        },
      })
    )
  );

  const decodeHttpRequest = flow(
    azureLegacyHandler.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireCreateSignaturePayload)
  );

  const encodeHttpSuccessResponse = flow(
    SignatureToApiModel.encode,
    success(SignatureDetailView)
  );

  return createHandler(
    decodeHttpRequest,
    createSignature,
    errorWithLog(ConsoleLogger),
    encodeHttpSuccessResponse
  );
};

export const makeCreateSignatureFunction = flow(
  makeCreateSignatureHandler,
  azureLegacyHandler.unsafeRun
);
