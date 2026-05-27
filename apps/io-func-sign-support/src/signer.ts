import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import * as RTE from "fp-ts/ReaderTaskEither";

import { Signer, SignerRepository } from "@io-sign/io-sign/signer";

export type { SignerRepository };

export type GetSignerByFiscalCodeEnvironment = {
  signerRepository: SignerRepository;
};

export const getSignerByFiscalCode =
  (
    fiscalCode: FiscalCode
  ): RTE.ReaderTaskEither<GetSignerByFiscalCodeEnvironment, Error, Signer> =>
  ({ signerRepository }) =>
    signerRepository.getSignerByFiscalCode(fiscalCode);
