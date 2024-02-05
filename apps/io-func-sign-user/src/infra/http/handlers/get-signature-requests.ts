import * as H from "@pagopa/handler-kit";

import {
  fromEither,
  chainW,
  map,
  orElseW,
  chainEitherKW,
} from "fp-ts/ReaderTaskEither";

import { flow } from "fp-ts/function";

import * as RA from "fp-ts/ReadonlyArray";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { requireSignerId } from "../decoders/signer";

import { getSignatureRequestsBySignerId } from "../../../signature-request";
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
