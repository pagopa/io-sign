import * as azure from "@pagopa/handler-kit/lib/azure";
import { createHandler } from "@pagopa/handler-kit";
import { Database as CosmosDatabase } from "@azure/cosmos";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { identity, flow, pipe } from "fp-ts/lib/function";
import { validate } from "@io-sign/io-sign/validation";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { Issuer } from "@io-sign/io-sign/issuer";
import {
  contractActive,
  GenericContract,
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
import { SlackConfig } from "../../slack/config";
import { makePostSlackMessage } from "../../slack/client";
import { createNewIssuerMessage } from "../../slack/issuer-message";

const makeCreateIssuerHandler = (
  db: CosmosDatabase,
  selfCareConfig: SelfCareConfig,
  slackConfig: SlackConfig
) => {
  const getContractsFromEventHub = flow(
    azure.fromEventHubMessage(GenericContracts, "contracts"),
    TE.fromEither
  );

  const getInstitutionById = makeGetInstitutionById(makeFetchWithTimeout())(
    selfCareConfig
  );

  const postSlackMessage = makePostSlackMessage(makeFetchWithTimeout())(
    slackConfig
  );

  const checkIssuerWithSameVatNumber = makeCheckIssuerWithSameVatNumber(db);
  const insertIssuer = makeInsertIssuer(db);

  const createIssuer = (issuer: Issuer) =>
    pipe(
      // Replace issuer email (which is a PEC readed from contract) with support-email retrieved via API
      getInstitutionById(issuer.internalInstitutionId),
      TE.map((institution) => ({
        ...issuer,
        email: institution.supportEmail,
      })),
      TE.chain(insertIssuer),
      // C03G0KJBU7N is the id of #si_firmaconio_tech channel
      TE.chain(flow(createNewIssuerMessage, postSlackMessage("C03G0KJBU7N")))
    );

  const createIssuerFromContract = (contract: GenericContract) =>
    pipe(
      contract,
      contractActive,
      E.chainW(validate(IoSignContract, "This is not an `io-sign` contract")),
      E.map(ioSignContractToIssuer.encode),
      TE.fromEither,
      TE.chain(checkIssuerWithSameVatNumber),
      // If the contract is not validated because it belongs to another product or has already been entered, I will disregard it.
      TE.foldW(() => TE.of(undefined), createIssuer)
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
