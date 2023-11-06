import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { GetById, Issuer } from "./issuer";

export const issuerAlreadyExists =
  (id: Issuer["id"], internalInstitutionId: Issuer["institutionId"]) =>
  ({ getById }: GetById) =>
    pipe(
      getById(id, internalInstitutionId),
      TE.flatMap((issuer) =>
        O.isSome(issuer)
          ? TE.left(new Error("An issuer with this id already exists"))
          : TE.right(id)
      )
    );
