import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import { Signer } from "@io-sign/io-sign/signer";

import { EntityNotFoundError } from "@io-sign/io-sign/error";

export type SignerRepository = {
  getByFiscalCode: (
    fiscalCode: FiscalCode,
  ) => TE.TaskEither<Error, O.Option<Signer>>;
};

export type GetSignerByFiscalCodeEnvironment = {
  signerRepository: SignerRepository;
};

export const getSignerByFiscalCode =
  (
    fiscalCode: FiscalCode,
  ): RTE.ReaderTaskEither<GetSignerByFiscalCodeEnvironment, Error, Signer> =>
  ({ signerRepository: repo }) =>
    pipe(
      repo.getByFiscalCode(fiscalCode),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("The specified Signer was not found"),
        ),
      ),
    );
