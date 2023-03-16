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
  addSupportMailToIoSignContract,
  GenericContract,
  GenericContracts,
  IoSignContract,
  validateActiveContract,
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

  const createIssuerFromContract = (contract: GenericContract) =>
    pipe(
      contract,
      validateActiveContract,
      E.chainW(validate(IoSignContract, "This is not an `io-sign` contract")),
      TE.fromEither,
      TE.chain(addSupportMailToIoSignContract(getInstitutionById)),
      TE.map(ioSignContractToIssuer.encode),
      TE.chain(checkIssuerWithSameVatNumber),
      // If the contract is not validated because it belongs to another product or has already been entered, I will disregard it.
      TE.foldW(() => TE.of(undefined), insertIssuer)
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
