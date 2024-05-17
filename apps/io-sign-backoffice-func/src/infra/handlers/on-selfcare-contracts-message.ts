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

import { sendMessage } from "../slack/message";
import { saveUsersToSpreadsheet } from "../google/sheets";

import { issuerAlreadyExists } from "@/issuer";
import { getUsersByInstitutionId } from "@/user";

declare const inactivateIssuer: (
  contract: ClosedIoSignContract
) => RTE.ReaderTaskEither<unknown, Error, void>;

const sendOnboardingMessage = ({
  institution,
  internalIstitutionID,
}: ActiveIoSignContract) =>
  pipe(
    issuerAlreadyExists({
      id: internalIstitutionID,
      institutionId: internalIstitutionID,
    }),
    RTE.filterOrElse(
      (exists) => exists === false,
      () => new Error("An issuer with this id already exists")
    ),
    RTE.flatMap(() =>
      sendMessage(
        `(_backoffice_) *${institution.description}* (\`institutionId: ${internalIstitutionID}\`, \`taxCode: ${institution.taxCode}\`) ha effettuato l'onboarding 🎉`
      )
    )
  );

const exportContacts = ({
  institution,
  internalIstitutionID,
}: ActiveIoSignContract) =>
  pipe(
    getUsersByInstitutionId(internalIstitutionID),
    RTE.flatMap((contacts) =>
      saveUsersToSpreadsheet(contacts, institution.description)
    ),
    RTE.flatMap(() =>
      sendMessage(
        `(_backoffice_) I contatti di *${institution.description}* sono stati salvati nel foglio di lavoro ✅`
      )
    )
  );

export const onSelfcareContractsMessageHandler = of(
  (contracts: IoSignContracts) =>
    pipe(
      contracts,
      A.map((contract) =>
        isActive(contract)
          ? pipe(
              sendOnboardingMessage(contract),
              RTE.flatMap(() => exportContacts(contract))
            )
          : inactivateIssuer(contract)
      ),
      A.sequence(RTE.ApplicativePar)
    )
);
