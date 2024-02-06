import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { of } from "@pagopa/handler-kit";
import {
  ActiveIoSignContract,
  ClosedIoSignContract,
  IoSignContracts,
  isActive,
} from "../selfcare/contract";
import { IssuerMessage } from "../slack/issuer-message";
import { issuerAlreadyExists } from "../back-office/use-cases";
import { GetById } from "../back-office/issuer";
import { SendMessage } from "../slack/message";

declare const inactivateIssuer: (
  contract: ClosedIoSignContract
) => RTE.ReaderTaskEither<unknown, Error, void>;

const sendOnboardingMessage =
  (contract: ActiveIoSignContract) =>
  ({ getById, sendMessage }: GetById & SendMessage) =>
    pipe(
      issuerAlreadyExists(
        contract.billing.vatNumber,
        contract.internalIstitutionID
      )({ getById }),
      TE.map(() =>
        IssuerMessage({
          internalInstitutionId: contract.internalIstitutionID,
          vatNumber: contract.billing.vatNumber,
          description: contract.institution.description,
        })
      ),
      TE.flatMap(sendMessage)
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
