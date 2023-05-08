import * as H from "@pagopa/handler-kit";
import { sequenceS } from "fp-ts/lib/Apply";

import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { flow, pipe } from "fp-ts/lib/function";

import { ContainerClient } from "@azure/storage-blob";

import * as A from "fp-ts/lib/Array";

import { toDocumentWithSasUrl } from "@io-sign/io-sign/infra/azure/storage/document-url";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import {
  SignatureRequest,
  getSignatureRequest,
} from "../../../signature-request";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { requireSigner } from "../decoders/signer";
import { requireSignatureRequestId } from "../decoders/signature-request";

const grantReadAccessToDocuments =
  (request: SignatureRequest) =>
  (r: {
    validatedContainerClient: ContainerClient;
    signedContainerClient: ContainerClient;
  }) =>
    pipe(
      request.documents,
      A.map(toDocumentWithSasUrl("r", 5)),
      A.sequence(RTE.ApplicativeSeq),
      RTE.map((documents) => ({ ...request, documents }))
    )(
      request.status === "SIGNED"
        ? r.signedContainerClient
        : r.validatedContainerClient
    );

export const GetSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      signerId: pipe(requireSigner(req), RTE.fromEither),
      signatureRequestId: requireSignatureRequestId(req),
    }),
    RTE.chainW(({ signerId, signatureRequestId }) =>
      getSignatureRequest(signatureRequestId, signerId.id)
    ),
    RTE.chainW(grantReadAccessToDocuments),
    RTE.map(flow(SignatureRequestToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
