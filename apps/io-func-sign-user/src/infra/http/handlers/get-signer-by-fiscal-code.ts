import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { flow, pipe } from "fp-ts/lib/function";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { makeRetriveUserProfileSenderAllowed } from "@io-sign/io-sign/infra/io-services/profile";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { GetSignerByFiscalCodeBody } from "../models/GetSignerByFiscalCodeBody";
import { SignerToApiModel } from "../encoders/signer";

type GetSignerByFiscalCodeDependencies = {
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  ioApiClient: IOApiClient;
};

const requireFiscalCodeFromBody = (
  req: H.HttpRequest
): E.Either<Error, FiscalCode> =>
  pipe(
    req.body,
    H.parse(GetSignerByFiscalCodeBody),
    E.chainW((body) =>
      pipe(body.fiscal_code, H.parse(FiscalCode, "Not a valid fiscal code"))
    )
  );

export const GetSignerByFiscalCodeHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(requireFiscalCodeFromBody(req)),
    RTE.chainW(
      (fiscalCode) =>
        ({
          pdvTokenizerClient,
          ioApiClient
        }: GetSignerByFiscalCodeDependencies) => {
          const retriveUserProfile =
            makeRetriveUserProfileSenderAllowed(ioApiClient);
          const getSignerByFiscalCode =
            makeGetSignerByFiscalCode(pdvTokenizerClient);
          return pipe(
            fiscalCode,
            retriveUserProfile,
            TE.chain(() => getSignerByFiscalCode(fiscalCode))
          );
        }
    ),
    RTE.chainEitherKW(
      O.fold(
        () => E.left(new EntityNotFoundError("Signer")),
        (signer) => E.right(signer)
      )
    ),
    RTE.map(flow(SignerToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
