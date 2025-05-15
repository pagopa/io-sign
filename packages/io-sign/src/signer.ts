import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";

import { Id } from "./id";

export const Signer = t.type({
  id: Id
});

export type Signer = t.TypeOf<typeof Signer>;

/** @deprecated use "SignerRepository" interface instead */
export type GetSignerByFiscalCode = (
  fiscalCode: FiscalCode
) => TE.TaskEither<Error, O.Option<Signer>>;

/** @deprecated use "SignerRepository" interface instead */
export type GetFiscalCodeBySignerId = (
  id: Signer["id"]
) => TE.TaskEither<Error, O.Option<FiscalCode>>;

export interface SignerRepository {
  getSignerByFiscalCode: (
    fiscalCode: FiscalCode
  ) => TE.TaskEither<Error, Signer>;
  getFiscalCodeBySignerId: (
    id: Signer["id"]
  ) => TE.TaskEither<Error, FiscalCode>;
}

export interface SignerEnvironment {
  signerRepository: SignerRepository;
}

export const getSignerByFiscalCode =
  (fiscalCode: FiscalCode) =>
  (r: SignerEnvironment): TE.TaskEither<Error, Signer> =>
    r.signerRepository.getSignerByFiscalCode(fiscalCode);

export const getFiscalCodeBySignerId =
  (id: Signer["id"]) =>
  (r: SignerEnvironment): TE.TaskEither<Error, FiscalCode> =>
    r.signerRepository.getFiscalCodeBySignerId(id);
