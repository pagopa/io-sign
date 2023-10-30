import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import {
  ActiveIoSignContract,
  ClosedIoSignContract,
  IoSignContracts,
  isActive,
} from "../selfcare/contract";
import { getSupportEmail } from "../selfcare/use-cases";
import { sendMessageToSlack } from "../slack/use-cases";
import { IssuerMessage } from "../slack/issuer-message";
import { IssuerEnvironment } from "../back-office/issuer";
import { issuerAlreadyExists } from "../back-office/use-cases";
import { SlackEnvironment } from "../slack/channel";
import { of } from "./handler-kit/handler";

declare const inactivateIssuer: (
  contract: ClosedIoSignContract
) => RTE.ReaderTaskEither<SlackEnvironment & IssuerEnvironment, Error, void>;

const sendOnboardingMessage = (contract: ActiveIoSignContract) =>
  pipe(
    issuerAlreadyExists(
      contract.billing.vatNumber,
      contract.internalIstitutionID
    ),
    RTE.flatMap(() => getSupportEmail(contract.internalIstitutionID)),
    RTE.map((email) =>
      IssuerMessage({
        internalInstitutionId: contract.internalIstitutionID,
        vatNumber: contract.billing.vatNumber,
        email,
        description: contract.institution.description,
      })
    ),
    RTE.flatMap(sendMessageToSlack)
  );

export const onSelfcareContractsMessageHandler = of(
  (contracts: IoSignContracts) =>
    pipe(
      contracts,
      A.map((contract) =>
        isActive(contract)
          ? sendOnboardingMessage(contract)
          : inactivateIssuer(contract)
      ),
      A.sequence(RTE.ApplicativePar)
    )
);
