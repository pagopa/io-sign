import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import * as H from "@pagopa/handler-kit";
import {
  chainEitherKW,
  chainW,
  fromEither,
  map,
  orElseW
} from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import { flow } from "fp-ts/function";

import { getSignatureRequestsBySignerId } from "../../../signature-request";
import { requireSignerId } from "../decoders/signer";
import { SignatureRequestToListView } from "../encoders/signature-request";
import { SignatureRequestList } from "../models/SignatureRequestList";

export const GetSignatureRequestsHandler = H.of(
  flow(
    requireSignerId,
    fromEither,
    chainW(getSignatureRequestsBySignerId),
    map(RA.map(SignatureRequestToListView.encode)),
    map((items) => ({ items })),
    chainEitherKW(H.parse(SignatureRequestList)),
    map(H.successJson),
    orElseW(logErrorAndReturnResponse)
  )
);
