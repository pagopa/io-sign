import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";
import { Database as CosmosDatabase } from "@azure/cosmos";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { identity, flow, pipe } from "fp-ts/lib/function";
import { validate } from "@io-sign/io-sign/validation";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import {
  contractActive,
  GenericContracts,
  IoSignContract,
} from "../../self-care/contract";
import { ioSignContractToIssuer } from "../../self-care/encoder";
import {
  makeCheckIssuerWithSameVatNumber,
  makeInsertIssuer,
} from "../cosmos/issuer";
import { makeGetInstitutionById } from "../../self-care/client";
import { SelfCareConfig } from "../../self-care/config";

const makeCreateIssuerHandler = (
  db: CosmosDatabase,
  selfCareConfig: SelfCareConfig
) => {
  const getContractsFromEventHub = flow(
    azure.fromEventHubMessage(GenericContracts, "contracts"),
    TE.fromEither
  );

  const getInstitutionById = makeGetInstitutionById(makeFetchWithTimeout())(
    selfCareConfig
  );

  const checkIssuerWithSameVatNumber = makeCheckIssuerWithSameVatNumber(db);
  const insertIssuer = makeInsertIssuer(db);

  // TODO: [SFEQS-1490] Add a retry if the insert fails
  const createIssuerFromContract = flow(
    contractActive,
    E.chainW(validate(IoSignContract, "This is not an `io-sign` contract")),
    E.map(ioSignContractToIssuer.encode),
    TE.fromEither,
    TE.chain(checkIssuerWithSameVatNumber),
    // Replace issuer email (which is a PEC readed from contract) with support-email retrieved via API
    TE.chain((issuer) =>
      pipe(
        getInstitutionById(issuer.internalInstitutionId),
        TE.map((institution) => ({
          ...issuer,
          email: institution.supportEmail,
        }))
      )
    ),
    TE.chain(insertIssuer),
    // This is a fire-and-forget operation
    TE.altW(() => TE.right(undefined))
  );

  return createHandler(
    getContractsFromEventHub,
    flow(RA.map(createIssuerFromContract), RA.sequence(TE.ApplicativePar)),
    identity,
    () => undefined
  );
};

export const makeCreateIssuerFunction = flow(
  makeCreateIssuerHandler,
  azure.unsafeRun
);
