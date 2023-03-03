import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";
import { Database as CosmosDatabase } from "@azure/cosmos";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";

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

const makeValidateUploadHandler = (db: CosmosDatabase) => {
  const getContractsFromEventHub = flow(
    azure.fromEventHubMessage(GenericContracts, "contracts"),
    TE.fromEither
  );

  const checkIssuerWithSameInternalInstitutionId =
    makeCheckIssuerWithSameInternalInstitutionId(db);
  const insertIssuer = makeInsertIssuer(db);

  const createIssuerFromContract = flow(
    contractActive,
    E.chainW(validate(IoSignContract, "This is not an `io-sign` contract")),
    E.map(ioSignContractToIssuer.encode),
    TE.fromEither,
    TE.chain(checkIssuerWithSameInternalInstitutionId),
    TE.chain(insertIssuer)
  );

  return createHandler(
    getContractsFromEventHub,
    flow(
      RA.map(createIssuerFromContract),
      RA.sequence(T.ApplicativePar),
      /* Because contracts are processed in batches, some may not belong to the io-sign-prod;
       * therefore, the entire batch must be processed and not have a break even if only one error occurs.
       */
      T.map(RA.rights),
      TE.fromTask
    ),
    identity,
    () => undefined
  );
};

export const makeCreateIssuerFunction = (database: CosmosDatabase) =>
  pipe(makeValidateUploadHandler(database), azure.unsafeRun);
