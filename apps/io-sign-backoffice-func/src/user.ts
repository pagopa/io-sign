import { Institution, User } from "@io-sign/io-sign/institution";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

export type UserRepository = {
  getUsersByInstitutionId: (
    institutionId: Institution["id"]
  ) => Promise<User[]>;
};

export type UserEnvironment = {
  userRepository: UserRepository;
};

export const getUsersByInstitutionId =
  (institutionId: Institution["id"]) => (r: UserEnvironment) =>
    TE.tryCatch(
      () => r.userRepository.getUsersByInstitutionId(institutionId),
      E.toError
    );
