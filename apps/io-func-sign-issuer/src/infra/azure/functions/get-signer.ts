import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { error, success } from "@io-sign/io-sign/infra/http/response";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { makeRetriveUserProfileSenderAllowed } from "@io-sign/io-sign/infra/io-services/profile";
import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { Signer } from "@io-sign/io-sign/signer";
import { validate } from "@io-sign/io-sign/validation";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RE from "fp-ts/lib/ReaderEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { createHandler } from "handler-kit-legacy";
import * as azure from "handler-kit-legacy/lib/azure";
import { HttpRequest } from "handler-kit-legacy/lib/http";

import { SignerToApiModel } from "../../http/encoders/signer";
import { GetSignerByFiscalCodeBody } from "../../http/models/GetSignerByFiscalCodeBody";
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
      E.fromOption(() => new EntityNotFoundError("Signer")),
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
