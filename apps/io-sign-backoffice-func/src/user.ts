import { Institution, User } from "@io-sign/io-sign/institution";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

export interface UserRepository {
  getUsersByInstitutionId: (
    institutionId: Institution["id"]
  ) => Promise<Array<User>>;
}

export interface UserEnvironment {
  userRepository: UserRepository;
}

export const getUsersByInstitutionId =
  (institutionId: Institution["id"]) => (r: UserEnvironment) =>
    TE.tryCatch(
      () => r.userRepository.getUsersByInstitutionId(institutionId),
      E.toError
    );
