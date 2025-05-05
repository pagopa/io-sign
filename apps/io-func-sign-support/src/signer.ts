import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { Signer } from "@io-sign/io-sign/signer";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

export interface SignerRepository {
  getByFiscalCode: (
    fiscalCode: FiscalCode
  ) => TE.TaskEither<Error, O.Option<Signer>>;
}

export interface GetSignerByFiscalCodeEnvironment {
  signerRepository: SignerRepository;
}

export const getSignerByFiscalCode =
  (
    fiscalCode: FiscalCode
  ): RTE.ReaderTaskEither<GetSignerByFiscalCodeEnvironment, Error, Signer> =>
  ({ signerRepository: repo }) =>
    pipe(
      repo.getByFiscalCode(fiscalCode),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("The specified Signer was not found")
        )
      )
    );
