import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { of } from "@pagopa/handler-kit";
import {
  ActiveIoSignContract,
  ClosedIoSignContract,
  IoSignContracts,
  isActive,
} from "../selfcare/contract";
import { sendMessageToSlack } from "../slack/use-cases";
import { IssuerMessage } from "../slack/issuer-message";
import { issuerAlreadyExists } from "../back-office/use-cases";

declare const inactivateIssuer: (
  contract: ClosedIoSignContract
) => RTE.ReaderTaskEither<unknown, Error, void>;

const sendOnboardingMessage = (contract: ActiveIoSignContract) =>
  pipe(
    issuerAlreadyExists(
      contract.billing.vatNumber,
      contract.internalIstitutionID
    ),
    RTE.map(() =>
      IssuerMessage({
        internalInstitutionId: contract.internalIstitutionID,
        vatNumber: contract.billing.vatNumber,
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
