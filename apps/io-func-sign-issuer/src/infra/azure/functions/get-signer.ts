import { HttpRequest } from "@pagopa/handler-kit/lib/http";
import { Signer, signerNotFoundError } from "@pagopa/io-sign/signer";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as RE from "fp-ts/lib/ReaderEither";

import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";

import * as azure from "@pagopa/handler-kit/lib/azure";

import { PdvTokenizerClientWithApiKey } from "@internal/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@internal/pdv-tokenizer/signer";

import * as TE from "fp-ts/lib/TaskEither";

import * as O from "fp-ts/lib/Option";
import { createHandler } from "@pagopa/handler-kit";
import { validate } from "@pagopa/io-sign/validation";
import { error, success } from "@pagopa/io-sign/infra/http/response";
import { makeRetriveUserProfileSenderAllowed } from "@internal/io-services/profile";
import { IOApiClient } from "@internal/io-services/client";
import { GetSignerByFiscalCodeBody } from "../../http/models/GetSignerByFiscalCodeBody";

import { SignerToApiModel } from "../../http/encoders/signer";
import { SignerDetailView } from "../../http/models/SignerDetailView";

const makeGetSignerByFiscalCodeHandler = (
  pdvTokenizerClientWithApiKey: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient
) => {
  const retriveUserProfile = makeRetriveUserProfileSenderAllowed(ioApiClient);
  const getSignerByFiscalCode = makeGetSignerByFiscalCode(
    pdvTokenizerClientWithApiKey
  );

  const getAllowedSignerByFiscalCode = (fiscalCode: FiscalCode) =>
    pipe(
      fiscalCode,
      retriveUserProfile,
      TE.chain(() => getSignerByFiscalCode(fiscalCode))
    );

  const requireFiscalCode: RE.ReaderEither<HttpRequest, Error, FiscalCode> =
    flow(
      (req) => req.body,
      validate(GetSignerByFiscalCodeBody),
      E.map((body) => body.fiscal_code),
      E.chain(validate(FiscalCode, "Not a valid fiscal code"))
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
    getAllowedSignerByFiscalCode,
    error,
    encodeHttpSuccessResponse
  );
};

export const makeGetSignerFunction = (
  pdvTokenizerClient: PdvTokenizerClientWithApiKey,
  ioApiClient: IOApiClient
) =>
  pipe(
    makeGetSignerByFiscalCodeHandler(pdvTokenizerClient, ioApiClient),
    azure.unsafeRun
  );
