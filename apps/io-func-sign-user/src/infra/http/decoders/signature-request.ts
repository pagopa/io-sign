import * as H from "@pagopa/handler-kit";
import { lookup } from "fp-ts/lib/Record";
import { SignatureRequestId } from "@io-sign/io-sign/signature-request";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";

export const requireSignatureRequestId = (req: H.HttpRequest) =>
  pipe(
    req.path,
    lookup("signatureRequestId"),
    RTE.fromOption(() => new H.HttpBadRequestError(`Missing "id" in path`)),
    RTE.chainEitherKW(H.parse(SignatureRequestId, `Invalid "id" supplied`))
  );
