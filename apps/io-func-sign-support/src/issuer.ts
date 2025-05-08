import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { Issuer as IssuerFull } from "@io-sign/io-sign/issuer";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import * as t from "io-ts";

export const Issuer = t.type({
  id: IssuerFull.props.id,
  vatNumber: IssuerFull.props.vatNumber
});

export type Issuer = t.TypeOf<typeof Issuer>;

export interface IssuerRepository {
  getByVatNumber: (
    vatNumber: NonEmptyString
  ) => TE.TaskEither<Error, O.Option<Issuer>>;
}

export interface GetIssuerByVatNumberEnvironment {
  issuerRepository: IssuerRepository;
}

export const getIssuerByVatNumber =
  (
    vatNumber: NonEmptyString
  ): RTE.ReaderTaskEither<GetIssuerByVatNumberEnvironment, Error, Issuer> =>
  ({ issuerRepository: repo }) =>
    pipe(
      repo.getByVatNumber(vatNumber),
      TE.chain(
        TE.fromOption(
          () => new EntityNotFoundError("The specified Issuer was not found")
        )
      )
    );
