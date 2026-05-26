import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { SignerRepository } from "@io-sign/io-sign/signer";
import { makeRetriveUserProfileSenderAllowed } from "@io-sign/io-sign/infra/io-services/profile";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { GetSignerByFiscalCodeBody } from "../models/GetSignerByFiscalCodeBody";
import { SignerToApiModel } from "../encoders/signer";

type GetSignerDependencies = {
  signerRepository: SignerRepository;
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

export const GetSignerHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.fromEither(requireFiscalCodeFromBody(req)),
    RTE.chainW(
      (fiscalCode) =>
        ({ signerRepository, ioApiClient }: GetSignerDependencies) => {
          const retriveUserProfile =
            makeRetriveUserProfileSenderAllowed(ioApiClient);

          return pipe(
            fiscalCode,
            retriveUserProfile,
            TE.chain(() => signerRepository.getSignerByFiscalCode(fiscalCode))
          );
        }
    ),
    RTE.map(flow(SignerToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
