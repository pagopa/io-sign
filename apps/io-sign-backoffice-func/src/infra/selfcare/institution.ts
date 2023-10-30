import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { z } from "zod";
import {
  defaultHeader,
  isSuccessful,
} from "@io-sign/io-sign/infra/client-utils";
import { pipe } from "fp-ts/lib/function";
import { parse } from "../handlers/handler-kit/validation";

const institution = z.object({
  description: z.string().min(1),
  supportEmail: z.string().email(),
});

export type Institution = z.infer<typeof institution>;

export type InstitutionRepository = {
  getById: (
    internalInstitutionId: string
  ) => TE.TaskEither<Error, O.Option<Institution>>;
};

export type InstitutionEnvironment = {
  institutionRepository: InstitutionRepository;
};

export class SelfcareInstitutionRepository implements InstitutionRepository {
  #basePath: string;
  #apiKey: string;

  constructor(basePath: string, apiKey: string) {
    this.#basePath = basePath;
    this.#apiKey = apiKey;
  }

  getById(
    internalInstitutionId: string
  ): TE.TaskEither<Error, O.Option<Institution>> {
    return pipe(
      TE.tryCatch(
        () =>
          fetch(
            `${
              this.#basePath
            }/external/v2/institutions/${internalInstitutionId}`,
            {
              method: "GET",
              headers: {
                ...defaultHeader,
                "Ocp-Apim-Subscription-Key": this.#apiKey,
              },
            }
          ),
        E.toError
      ),
      TE.filterOrElse(
        (response) => isSuccessful(response) || response.status === 404,
        () => new Error("The attempt to get institution from self-care failed.")
      ),
      TE.flatMap((response) =>
        response.status === 404
          ? TE.right(O.none)
          : pipe(
              TE.tryCatch(() => response.json(), E.toError),
              TE.flatMapEither(parse(institution)),
              TE.map(O.some)
            )
      )
    );
  }
}
