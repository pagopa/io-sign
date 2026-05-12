import * as H from "@pagopa/handler-kit";
import { sequenceS } from "fp-ts/lib/Apply";

import { BaseContainerClientWithFallback } from "@pagopa/azure-storage-migration-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";

import * as A from "fp-ts/lib/Array";

import { toDocumentWithSasUrlWithFallback } from "@io-sign/io-sign/infra/azure/storage/blob-storage-with-fallback";

import { flow, pipe } from "fp-ts/lib/function";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { getSignatureRequest } from "../../../signature-request";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { requireIssuer } from "../../http/decoders/issuer";
import { requireSignatureRequestId } from "../decoders/signature-request";

const grantReadAccessToDocuments =
  (request: SignatureRequestSigned) =>
  (r: { signedContainerClient: BaseContainerClientWithFallback }) =>
    pipe(
      request.documents,
      A.traverse(TE.ApplicativePar)((doc) =>
        toDocumentWithSasUrlWithFallback("r", 5)(doc)(r.signedContainerClient)
      ),
      TE.map((documents): SignatureRequestSigned => ({ ...request, documents }))
    );

export const GetSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      id: requireSignatureRequestId(req),
      issuer: requireIssuer(req)
    }),
    RTE.chainW(({ id, issuer }) => getSignatureRequest(id, issuer.id)),
    RTE.chainW((request) =>
      pipe(
        RTE.right(request),
        RTE.chainEitherK(H.parse(SignatureRequestSigned)),
        RTE.chainW(grantReadAccessToDocuments),
        RTE.alt(() => RTE.right(request))
      )
    ),
    RTE.map(flow(SignatureRequestToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
