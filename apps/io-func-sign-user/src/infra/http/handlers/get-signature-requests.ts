import * as H from "@pagopa/handler-kit";

import {
  chainEitherKW,
  chainW,
  map,
  orElseW
} from "fp-ts/ReaderTaskEither";
import { flow } from "fp-ts/function";
import * as RA from "fp-ts/ReadonlyArray";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { requireSignerIdFromFiscalCode } from "../decoders/signer";

import { getSignatureRequestsBySignerId } from "../../../signature-request";
import { SignatureRequestToListView } from "../encoders/signature-request";
import { SignatureRequestList } from "../models/SignatureRequestList";

export const GetSignatureRequestsHandler = H.of(
  flow(
    requireSignerIdFromFiscalCode,
    chainW(getSignatureRequestsBySignerId),
    map(RA.map(SignatureRequestToListView.encode)),
    map((items) => ({ items })),
    chainEitherKW(H.parse(SignatureRequestList)),
    map(H.successJson),
    orElseW(logErrorAndReturnResponse)
  )
);
