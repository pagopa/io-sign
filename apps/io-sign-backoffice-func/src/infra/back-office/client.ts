import { z } from "zod";

import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { issuerSchema } from "@io-sign/io-sign/issuer";
import { safeParse } from "../handlers/validation";
import { dispatcher } from "../http/fetch";

import { Contact, contactSchema } from "../../index";

export type Issuer = z.TypeOf<typeof issuerSchema>;

export class BackofficeApiClient {
  #baseURL: string;
  #options: RequestInit;

  constructor(baseURL: string, apiKey: string) {
    this.#baseURL = baseURL;
    this.#options = {
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": apiKey,
      },
      dispatcher,
    };
  }

  getIssuer(
    k: Pick<Issuer, "id" | "institutionId">
  ): TE.TaskEither<Error, O.Option<Issuer>> {
    const resource = new URL(
      `institutions/${k.institutionId}/issuers/${k.id}`,
      this.#baseURL
    );
    return pipe(
      TE.tryCatch(() => fetch(resource, this.#options), E.toError),
      TE.filterOrElse(
        (response) => response.status === 200 || response.status === 404,
        () => new Error("The attempt to get issuer from back office failed.")
      ),
      TE.flatMap((response) =>
        response.status === 404
          ? TE.right(O.none)
          : pipe(
              TE.tryCatch(() => response.json(), E.toError),
              TE.flatMapEither(safeParse(issuerSchema)),
              TE.map(O.some)
            )
      )
    );
  }

  getUsers(
    institutionId: Issuer["institutionId"]
  ): TE.TaskEither<Error, Contact[]> {
    const resource = new URL(
      `institutions/${institutionId}/users`,
      this.#baseURL
    );
    return pipe(
      TE.tryCatch(() => fetch(resource, this.#options), E.toError),
      TE.filterOrElse(
        (response) => response.status === 200,
        () => new Error("Can't retrieve institution users from back office.")
      ),
      TE.flatMap((response) => TE.tryCatch(() => response.json(), E.toError)),
      TE.flatMapEither(safeParse(z.array(contactSchema)))
    );
  }
}
