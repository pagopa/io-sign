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
import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

import { DocumentReady } from "@io-sign/io-sign/document";
import { getDocumentUrl } from "@io-sign/io-sign/infra/azure/storage/document-url";
import { getDocumentUrlWithFallback } from "@io-sign/io-sign/infra/azure/storage/blob-storage-with-fallback";
import { GetDocumentUrl } from "@io-sign/io-sign/document-url";
import { SignerRepository } from "@io-sign/io-sign/signer";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { stringFromBase64Encode } from "@io-sign/io-sign/utility";
import { validate } from "@io-sign/io-sign/validation";

import { ConsoleLogger } from "@io-sign/io-sign/infra/console-logger";
import * as L from "@pagopa/logger";

import { requireSpidLevel } from "../decoders/signer";
import { requireFiscalCode } from "../decoders/fiscal-code";
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

import type { LollipopApiClientExt } from "../../lollipop/client";
import type { LollipopApiClientInt } from "../../lollipop/internal-client";
import { makeGetLcParams } from "../../lollipop/internal-client";
import { makeGetValidatedEmailByFiscalCode } from "@io-sign/io-sign/infra/io-profile/profile";
import type { IoProfileClientWithApiKey } from "@io-sign/io-sign/infra/io-profile/client";
import { makeGetBase64SamlAssertion } from "../../lollipop/assertion";
import { getSignatureFromHeaderName } from "../../lollipop/signature";

export type CreateSignatureDependencies = {
  signerRepository: SignerRepository;
  lollipopApiClient: LollipopApiClientExt;
  lollipopApiClientInt: LollipopApiClientInt;
  ioProfileClient: IoProfileClientWithApiKey;
  db: CosmosDatabase;
  qtspQueue: QueueClient;
  validatedContainerClient: BaseContainerClientWithFallback;
  signedContainerClient: ContainerClient;
  qtspConfig: NamirialConfig;
};

export const CreateSignatureHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(
      sequenceS(E.Apply)({
        fiscalCode: requireFiscalCode(req),
        spidLevel: requireSpidLevel(req),
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
          signerRepository,
          lollipopApiClient,
          lollipopApiClientInt,
          ioProfileClient,
          db,
          qtspQueue,
          validatedContainerClient,
          signedContainerClient,
          qtspConfig
        }: CreateSignatureDependencies) => {
          const getValidatedEmailByFiscalCode =
            makeGetValidatedEmailByFiscalCode(ioProfileClient);
          const getLcParams = makeGetLcParams(lollipopApiClientInt);
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
            getDocumentUrlWithFallback("r", 60)(document)(
              validatedContainerClient
            );

          const getUploadSignedDocumentUrl: GetDocumentUrl = (
            document: DocumentReady
          ) =>
            pipe(document, getDocumentUrl("racw", 60))(signedContainerClient);

          const createSignature = makeCreateSignature(
            signerRepository,
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
              signer: signerRepository.getSignerByFiscalCode(
                sequence.fiscalCode
              ),
              email: getValidatedEmailByFiscalCode(sequence.fiscalCode),
              lcParams: getLcParams({
                assertionRef: sequence.lollipopParams.assertionRef,
                signatureInput: sequence.lollipopParams.signatureInput
              })
            }),
            TE.chainW(({ signer, email, lcParams }) =>
              pipe(
                sequenceS(TE.ApplySeq)({
                  samlAssertionBase64: getBase64SamlAssertion({
                    assertionRef: lcParams.assertion_ref,
                    jwtAuthorization: lcParams.lc_authentication_bearer,
                    assertionType: lcParams.assertion_type
                  }),
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
                  ({
                    samlAssertionBase64,
                    tosSignature,
                    challengeSignature
                  }) => ({
                    signer,
                    email,
                    samlAssertionBase64,
                    tosSignature,
                    challengeSignature,
                    publicKey: lcParams.pub_key
                  })
                )
              )
            ),
            TE.map(
              ({
                signer,
                email,
                samlAssertionBase64,
                tosSignature,
                challengeSignature,
                publicKey
              }) => ({
                signer,
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
                email,
                signatureRequestId: sequence.body.signatureRequestId,
                signatureValidationParams: {
                  signatureInput: sequence.lollipopParams.signatureInput,
                  publicKey,
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
        H.withStatusCode(200)
      )
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
