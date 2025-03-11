import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { InstitutionDetail } from "@io-sign/io-sign/institution";
import { EntityNotFoundError } from "@io-sign/io-sign/error";

import { getIssuer } from "@/issuer";

export type InstitutionRepository = {
  getInstitutionById(
    id: InstitutionDetail["id"]
  ): Promise<InstitutionDetail | undefined>;
};

type InstitutionEnvironment = {
  institutionRepository: InstitutionRepository;
};

export const getInstitutionById = (id: string) => (r: InstitutionEnvironment) =>
  pipe(
    TE.tryCatch(
      () => r.institutionRepository.getInstitutionById(id),
      () => new Error("Error retrieving the Institution.")
    ),
    TE.flatMap(
      TE.fromNullable(new EntityNotFoundError("Institution not found."))
    )
  );

export const getIssuerByInstitution = (
  institution: Pick<InstitutionDetail, "id" | "taxCode">
) => getIssuer({ id: institution.id, institutionId: institution.id });
