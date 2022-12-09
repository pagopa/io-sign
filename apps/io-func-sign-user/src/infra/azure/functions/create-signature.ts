import { Database as CosmosDatabase } from "@azure/cosmos";

import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";

import { created, error } from "@io-sign/io-sign/infra/http/response";
import { validate } from "@io-sign/io-sign/validation";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe, flow } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { QueueClient } from "@azure/storage-queue";
import { requireSigner } from "../../http/decoder/signer";
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
import { makeEnqueueMessage } from "../storage/queue";
import { MockConfig } from "../../../app/use-cases/__mocks__/config";

const makeCreateSignatureHandler = (
  tokenizer: PdvTokenizerClientWithApiKey,
  db: CosmosDatabase,
  qtspQueue: QueueClient,
  qtspConfig: NamirialConfig,
  mockConfig: MockConfig
) => {
  const getFiscalCodeBySignerId = makeGetFiscalCodeBySignerId(tokenizer);
  const creatQtspSignatureRequest = makeCreateSignatureRequestWithToken()(
    makeGetToken()
  )(qtspConfig);

  const insertSignature = makeInsertSignature(db);
  const enqueueSignature = makeEnqueueMessage(qtspQueue);

  const createSignature = makeCreateSignature(
    getFiscalCodeBySignerId,
    creatQtspSignatureRequest,
    insertSignature,
    enqueueSignature
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
    }),
    RTE.map(
      ({
        signer,
        documentsSignature,
        qtspClauses,
        body: { email, signatureRequestId },
      }) => ({
        signer,
        qtspClauses,
        documentsSignature,
        email,
        signatureRequestId,
        spidAssertion: mockConfig.spidAssertionMock,
      })
    )
  );

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireCreateSignaturePayload)
  );

  const encodeHttpSuccessResponse = flow(
    SignatureToApiModel.encode,
    created(SignatureDetailView)
  );

  return createHandler(
    decodeHttpRequest,
    createSignature,
    error,
    encodeHttpSuccessResponse
  );
};

export const makeCreateSignatureFunction = flow(
  makeCreateSignatureHandler,
  azure.unsafeRun
);
