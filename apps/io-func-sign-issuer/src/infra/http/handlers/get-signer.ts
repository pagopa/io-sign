import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { SignerRepository } from "@io-sign/io-sign/signer";
import { makeRetriveUserProfileSenderAllowed } from "@io-sign/io-sign/infra/io-services/profile";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { GetSignerByFiscalCodeBody } from "../models/GetSignerByFiscalCodeBody";
import { SignerToApiModel } from "../encoders/signer";
import { requireSubscriptionId } from "../decoders/subscription-id";
import {
  AccessControlRepository,
  ensureFiscalCodeAllowed
} from "../../../access-control";

type GetSignerDependencies = {
  signerRepository: SignerRepository;
  ioApiClient: IOApiClient;
  accessControlRepository: AccessControlRepository;
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

const parseRequest = (req: H.HttpRequest) =>
  sequenceS(E.Apply)({
    fiscalCode: requireFiscalCodeFromBody(req),
    subscriptionId: requireSubscriptionId(req)
  });

export const GetSignerHandler = H.of((req: H.HttpRequest) =>
  pipe(
    parseRequest(req),
    RTE.fromEither,
    RTE.chainFirstW(({ subscriptionId, fiscalCode }) =>
      ensureFiscalCodeAllowed(subscriptionId, fiscalCode)
    ),
    RTE.chainW(
      ({ fiscalCode }) =>
        ({ signerRepository, ioApiClient }: GetSignerDependencies) =>
          pipe(
            fiscalCode,
            makeRetriveUserProfileSenderAllowed(ioApiClient),
            TE.chain(() => signerRepository.getSignerByFiscalCode(fiscalCode))
          )
    ),
    RTE.map(flow(SignerToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
