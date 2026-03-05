import { Database as CosmosDatabase } from "@azure/cosmos";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";
import { validate } from "@io-sign/io-sign/validation";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";

import { Issuer } from "@io-sign/io-sign/issuer";
import {
  GenericContract,
  GenericContracts,
  IoSignContract,
  addSupportMailToIoSignContract,
  validateActiveContract
} from "../../self-care/contract";
import { ioSignContractToIssuer } from "../../self-care/encoder";
import {
  makeCheckIssuerWithSameVatNumber,
  makeInsertIssuer
} from "../cosmos/issuer";
import { makeGetInstitutionById } from "../../self-care/client";
import { SelfCareConfig } from "../../self-care/config";
import { SlackConfig } from "../../slack/config";
import { makePostSlackMessage } from "../../slack/client";
import { createNewIssuerMessage } from "../../slack/issuer-message";

export const makeCreateIssuerHandler =
  (
    db: CosmosDatabase,
    selfCareConfig: SelfCareConfig,
    slackConfig: SlackConfig
  ) =>
  async (messages: unknown[]): Promise<void> => {
    const contractsResult = pipe(messages, validate(GenericContracts));
    if (E.isLeft(contractsResult)) {
      return;
    }
    const contracts = contractsResult.right;

    const getInstitutionById = makeGetInstitutionById(makeFetchWithTimeout())(
      selfCareConfig
    );
    const postSlackMessage = makePostSlackMessage(makeFetchWithTimeout())(
      slackConfig
    );
    const checkIssuerWithSameVatNumber = makeCheckIssuerWithSameVatNumber(db);
    const insertIssuer = makeInsertIssuer(db);

    const sendNewIssuerSlackMessage = (newIssuer: Issuer) =>
      pipe(
        newIssuer,
        createNewIssuerMessage,
        postSlackMessage,
        TE.map(() => newIssuer)
      );

    const createIssuerFromContract = (contract: GenericContract) =>
      pipe(
        contract,
        validateActiveContract,
        E.chainW(validate(IoSignContract, "This is not an `io-sign` contract")),
        TE.fromEither,
        TE.chain(addSupportMailToIoSignContract(getInstitutionById)),
        TE.map(ioSignContractToIssuer.encode),
        TE.chain(checkIssuerWithSameVatNumber),
        // If the contract is not validated because it belongs to another product
        // or has already been entered, I will disregard it.
        TE.foldW(
          () => TE.of(undefined),
          flow(insertIssuer, TE.chain(sendNewIssuerSlackMessage))
        )
      );

    await pipe(
      contracts,
      RA.map(createIssuerFromContract),
      RA.sequence(TE.ApplicativePar)
    )();
  };
