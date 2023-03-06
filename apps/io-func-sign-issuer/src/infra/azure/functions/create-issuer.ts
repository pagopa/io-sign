import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";
import { Database as CosmosDatabase } from "@azure/cosmos";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { identity, flow, pipe } from "fp-ts/lib/function";
import { validate } from "@io-sign/io-sign/validation";

import {
  contractActive,
  GenericContracts,
  IoSignContract,
} from "../../self-care/contract";
import { ioSignContractToIssuer } from "../../self-care/encoder";
import {
  makeCheckIssuerWithSameInternalInstitutionId,
  makeInsertIssuer,
} from "../cosmos/issuer";

const makeCreateIssuerHandler = (db: CosmosDatabase) => {
  const getContractsFromEventHub = flow(
    azure.fromEventHubMessage(GenericContracts, "contracts"),
    TE.fromEither
  );

  const checkIssuerWithSameInternalInstitutionId =
    makeCheckIssuerWithSameInternalInstitutionId(db);
  const insertIssuer = makeInsertIssuer(db);

  // TODO: [SFEQS-1490] Add a retry if the insert fails
  const createIssuerFromContract = flow(
    contractActive,
    E.chainW(validate(IoSignContract, "This is not an `io-sign` contract")),
    E.map(ioSignContractToIssuer.encode),
    TE.fromEither,
    TE.chain(checkIssuerWithSameInternalInstitutionId),
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

export const makeCreateIssuerFunction = (database: CosmosDatabase) =>
  pipe(makeCreateIssuerHandler(database), azure.unsafeRun);
