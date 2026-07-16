import * as H from "@pagopa/handler-kit";
import { sequenceS } from "fp-ts/lib/Apply";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";

import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

import * as A from "fp-ts/lib/Array";

import { toDocumentWithSasUrlWithFallback } from "@io-sign/io-sign/infra/azure/storage/blob-storage-with-fallback";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import {
  getEnvironment,
  getSignatureRequest,
  SignatureRequest
} from "../../../signature-request";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { requireSignerFromFiscalCode } from "../decoders/signer";
import { requireSignatureRequestId } from "../decoders/signature-request";

const grantReadAccessToDocuments =
  (request: SignatureRequest) =>
  (r: {
    validatedContainerClient: BaseContainerClientWithFallback;
    signedContainerClient: BaseContainerClientWithFallback;
  }): TE.TaskEither<Error, SignatureRequest> => {
    if (request.status === "SIGNED") {
      return pipe(
        request.documents,
        A.traverse(TE.ApplicativePar)((doc) =>
          toDocumentWithSasUrlWithFallback("r", 5)(doc)(r.signedContainerClient)
        ),
        TE.map((documents) => ({ ...request, documents }))
      );
    }
    return pipe(
      request.documents,
      A.traverse(TE.ApplicativePar)((doc) =>
        toDocumentWithSasUrlWithFallback("r", 55)(doc)(
          r.validatedContainerClient
        )
      ),
      TE.map((documents) => ({ ...request, documents }))
    );
  };

export const GetSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      signerId: requireSignerFromFiscalCode(req),
      signatureRequestId: requireSignatureRequestId(req)
    }),
    RTE.chainW(({ signerId, signatureRequestId }) =>
      getSignatureRequest(signatureRequestId, signerId.id)
    ),
    RTE.chainW(grantReadAccessToDocuments),
    RTE.map((request) =>
      pipe(
        SignatureRequestToApiModel.encode(request),
        H.successJson,
        H.withHeader("x-io-sign-environment", getEnvironment(request))
      )
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
