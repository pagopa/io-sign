import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Database as CosmosDatabase } from "@azure/cosmos";
import { QueueClient } from "@azure/storage-queue";
import { ContainerClient } from "@azure/storage-blob";

import { DocumentReady } from "@io-sign/io-sign/document";
import { getDocumentUrl } from "@io-sign/io-sign/infra/azure/storage/document-url";
import { GetDocumentUrl } from "@io-sign/io-sign/document-url";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { stringFromBase64Encode } from "@io-sign/io-sign/utility";
import { validate } from "@io-sign/io-sign/validation";

import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import * as L from "@pagopa/logger";

import { requireSigner } from "../decoders/signer";
import { requireCreateSignatureLollipopParams } from "../decoders/lollipop";
import {
  requireCreateSignatureBody,
  requireDocumentsSignature
} from "../decoders/document-to-sign";
import { requireQtspClauses } from "../decoders/qtsp-clause";
import { SignatureToApiModel } from "../encoders/signature";

import { makeCreateSignature } from "../../../app/use-cases/create-signature";
import { makeGetToken } from "../../namirial/client";
import { NamirialConfig } from "../../namirial/config";
import { makeCreateSignatureRequestWithToken } from "../../namirial/signature-request";

import { makeInsertSignature } from "../../azure/cosmos/signature";
import {
  makeGetSignatureRequest,
  makeUpsertSignatureRequest
} from "../../azure/cosmos/signature-request";
import { makeNotifySignatureReadyEvent } from "../../azure/storage/signature";

import { LollipopApiClient } from "../../lollipop/client";
import { makeGetBase64SamlAssertion } from "../../lollipop/assertion";
import { getSignatureFromHeaderName } from "../../lollipop/signature";

export type CreateSignatureDependencies = {
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  lollipopApiClient: LollipopApiClient;
  db: CosmosDatabase;
  qtspQueue: QueueClient;
  validatedContainerClient: ContainerClient;
  signedContainerClient: ContainerClient;
  qtspConfig: NamirialConfig;
};

export const CreateSignatureHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(
      sequenceS(E.Apply)({
        signer: requireSigner(req),
        body: requireCreateSignatureBody(req),
        documentsSignature: requireDocumentsSignature(req),
        qtspClauses: requireQtspClauses(req),
        lollipopParams: requireCreateSignatureLollipopParams(req)
      })
    ),
    RTE.chainFirstIOK(() =>
      L.info("creating signature")({
        logger: ConsoleLogger
      })
    ),
    RTE.chainFirstIOK((params) =>
      L.debug("creating signature with params", { params })({
        logger: ConsoleLogger
      })
    ),
    RTE.chainW(
      (sequence) =>
        ({
          pdvTokenizerClient,
          lollipopApiClient,
          db,
          qtspQueue,
          validatedContainerClient,
          signedContainerClient,
          qtspConfig
        }: CreateSignatureDependencies) => {
          const getFiscalCodeBySignerId =
            makeGetFiscalCodeBySignerId(pdvTokenizerClient);
          const getBase64SamlAssertion =
            makeGetBase64SamlAssertion(lollipopApiClient);
          const getSignatureRequest = makeGetSignatureRequest(db);
          const creatQtspSignatureRequest =
            makeCreateSignatureRequestWithToken()(makeGetToken())(qtspConfig);
          const insertSignature = makeInsertSignature(db);
          const upsertSignatureRequest = makeUpsertSignatureRequest(db);
          const notifySignature = makeNotifySignatureReadyEvent(qtspQueue);

          const getDownloadDocumentUrl: GetDocumentUrl = (
            document: DocumentReady
          ) =>
            pipe(document, getDocumentUrl("r", 60))(validatedContainerClient);

          const getUploadSignedDocumentUrl: GetDocumentUrl = (
            document: DocumentReady
          ) =>
            pipe(document, getDocumentUrl("racw", 60))(signedContainerClient);

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

          return pipe(
            sequenceS(TE.ApplySeq)({
              samlAssertionBase64: getBase64SamlAssertion(
                sequence.lollipopParams
              ),
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
              )
            }),
            TE.map(
              ({ samlAssertionBase64, tosSignature, challengeSignature }) => ({
                signer: sequence.signer,
                qtspClauses: {
                  ...sequence.qtspClauses,
                  // TODO: [SFEQS-1237] workaround for WAF
                  filledDocumentUrl:
                    sequence.qtspClauses.filledDocumentUrl.includes("https://")
                      ? sequence.qtspClauses.filledDocumentUrl
                      : pipe(
                          sequence.qtspClauses.filledDocumentUrl,
                          stringFromBase64Encode,
                          E.chainW(
                            validate(
                              NonEmptyString,
                              "Invalid encoded filledDocumentUrl"
                            )
                          ),
                          E.getOrElse(
                            () => sequence.qtspClauses.filledDocumentUrl
                          )
                        )
                },
                documentsSignature: sequence.documentsSignature,
                email: sequence.body.email,
                signatureRequestId: sequence.body.signatureRequestId,
                signatureValidationParams: {
                  signatureInput: sequence.lollipopParams.signatureInput,
                  publicKey: sequence.lollipopParams.publicKey,
                  samlAssertionBase64,
                  tosSignature,
                  challengeSignature
                }
              })
            ),
            TE.chainFirstIOK((payload) =>
              L.debug("create signature payload", { payload })({
                logger: ConsoleLogger
              })
            ),
            TE.chain(createSignature)
          );
        }
    ),
    RTE.map((signature) =>
      pipe(
        SignatureToApiModel.encode(signature),
        H.successJson,
        H.withStatusCode(201)
      )
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
