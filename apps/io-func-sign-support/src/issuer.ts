import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import { Issuer as IssuerFull } from "@io-sign/io-sign/issuer";

import * as t from "io-ts";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const Issuer = t.type({
  id: IssuerFull.props.id,
  vatNumber: IssuerFull.props.vatNumber,
});

export type Issuer = t.TypeOf<typeof Issuer>;

export type IssuerRepository = {
  getByVatNumber: (
    vatNumber: NonEmptyString
  ) => TE.TaskEither<Error, O.Option<Issuer>>;
};

export type GetIssuerByVatNumberEnvironment = {
  issuerRepository: IssuerRepository;
};

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
