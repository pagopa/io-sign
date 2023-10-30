import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import {
  defaultHeader,
  isSuccessful,
} from "@io-sign/io-sign/infra/client-utils";
import { z } from "zod";
import { issuerSchema as issuer } from "@io-sign/io-sign/issuer";
import { parse } from "../handlers/handler-kit/validation";

export type Issuer = z.infer<typeof issuer>;

export type IssuerRepository = {
  getById: (
    id: Issuer["id"],
    institutionId: Issuer["institutionId"]
  ) => TE.TaskEither<Error, O.Option<Issuer>>;
};

export type IssuerEnvironment = {
  issuerRepository: IssuerRepository;
};

export class BackOfficeIssuerRepository implements IssuerRepository {
  #basePath: string;
  #apiKey: string;

  constructor(basePath: string, apiKey: string) {
    this.#basePath = basePath;
    this.#apiKey = apiKey;
  }

  getById(
    id: Issuer["id"],
    institutionId: Issuer["institutionId"]
  ): TE.TaskEither<Error, O.Option<Issuer>> {
    return pipe(
      TE.tryCatch(
        () =>
          fetch(
            `${this.#basePath}/institutions/${institutionId}/issuers/${id}`,
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
        () => new Error("The attempt to get issuer from back office failed.")
      ),
      TE.flatMap((response) =>
        response.status === 404
          ? TE.right(O.none)
          : pipe(
              TE.tryCatch(() => response.json(), E.toError),
              TE.flatMapEither(parse(issuer)),
              TE.map(O.some)
            )
      )
    );
  }
}
