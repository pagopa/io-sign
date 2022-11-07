import {
  body,
  error,
  HttpRequest,
  success,
} from "@pagopa/handler-kit/lib/http";
import { Signer, signerNotFoundError } from "@internal/io-sign/signer";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as RE from "fp-ts/lib/ReaderEither";

import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";

import * as azure from "@pagopa/handler-kit/lib/azure";

import * as TE from "fp-ts/lib/TaskEither";
import { validate } from "@pagopa/handler-kit/lib/validation";
import * as O from "fp-ts/lib/Option";
import { createHandler } from "@pagopa/handler-kit";
import { GetSignerByFiscalCodeBody } from "../../http/models/GetSignerByFiscalCodeBody";

import { SignerToApiModel } from "../../http/encoders/signer";
import { SignerDetailView } from "../../http/models/SignerDetailView";
import { mockGetSignerByFiscalCode } from "../../__mocks__/signer";

const makeGetSignerByFiscalCodeHandler = () => {
  const requireFiscalCode: RE.ReaderEither<HttpRequest, Error, FiscalCode> =
    flow(
      body(GetSignerByFiscalCodeBody),
      E.map((body) => body.fiscal_code),
      E.chain(validate(FiscalCode, "not a valid fiscal code"))
    );

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    E.chain(requireFiscalCode),
    TE.fromEither
  );

  const encodeHttpSuccessResponse = (maybeSigner: O.Option<Signer>) =>
    pipe(
      maybeSigner,
      E.fromOption(() => signerNotFoundError),
      E.fold(error, flow(SignerToApiModel.encode, success(SignerDetailView)))
    );

  return createHandler(
    decodeHttpRequest,
    mockGetSignerByFiscalCode,
    error,
    encodeHttpSuccessResponse
  );
};

export const run = pipe(makeGetSignerByFiscalCodeHandler(), azure.unsafeRun);
