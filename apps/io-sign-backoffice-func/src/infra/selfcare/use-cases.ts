import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { InstitutionEnvironment } from "./institution";

export const getSupportEmail =
  (internalInstitutionId: string) =>
  ({ institutionRepository }: InstitutionEnvironment) =>
    pipe(
      internalInstitutionId,
      institutionRepository.getById.bind(institutionRepository),
      TE.flatMap(
        O.match(
          () =>
            TE.left(new Error("An institution with this id does not exist")),
          (institution) => TE.right(institution.supportEmail)
        )
      )
    );
