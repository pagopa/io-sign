import * as H from "@pagopa/handler-kit";
import { sequenceS } from "fp-ts/lib/Apply";

import { ContainerClient } from "@azure/storage-blob";

import * as RTE from "fp-ts/lib/ReaderTaskEither";

import * as A from "fp-ts/lib/Array";

import { toDocumentWithSasUrl } from "@io-sign/io-sign/infra/azure/storage/document-url";

import { pipe, flow } from "fp-ts/lib/function";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { getSignatureRequest } from "../../../signature-request";
import { SignatureRequestToApiModel } from "../../http/encoders/signature-request";
import { requireIssuer } from "../../http/decoders/issuer";
import { requireSignatureRequestId } from "../decoders/signature-request";

const grantReadAccessToDocuments =
  (request: SignatureRequestSigned) =>
  (r: { signedContainerClient: ContainerClient }) =>
    pipe(
      request.documents,
      A.map(toDocumentWithSasUrl("r", 5)),
      A.sequence(RTE.ApplicativeSeq),
      RTE.map(
        (documents): SignatureRequestSigned => ({ ...request, documents })
      )
    )(r.signedContainerClient);

export const GetSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      id: requireSignatureRequestId(req),
      issuer: requireIssuer(req),
    }),
    RTE.chainW(({ id, issuer }) => getSignatureRequest(id, issuer.id)),
    RTE.chainW((request) =>
      pipe(
        RTE.right(request),
        RTE.chainEitherK(H.parse(SignatureRequestSigned)),
        RTE.chain(grantReadAccessToDocuments),
        RTE.alt(() => RTE.right(request))
      )
    ),
    RTE.map(flow(SignatureRequestToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
