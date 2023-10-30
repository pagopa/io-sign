import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { Issuer, IssuerEnvironment } from "./issuer";

export const issuerAlreadyExists =
  (id: Issuer["id"], internalInstitutionId: Issuer["institutionId"]) =>
  ({ issuerRepository }: IssuerEnvironment) =>
    pipe(
      issuerRepository.getById.bind(issuerRepository)(
        id,
        internalInstitutionId
      ),
      TE.flatMap((issuer) =>
        O.isSome(issuer)
          ? TE.left(new Error("An issuer with this id already exists"))
          : TE.right(id)
      )
    );
