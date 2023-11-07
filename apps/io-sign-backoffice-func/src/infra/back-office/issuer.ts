import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { issuerSchema as issuer } from "@io-sign/io-sign/issuer";
import { z } from "zod";
import {
  defaultHeader,
  isSuccessful,
} from "@io-sign/io-sign/infra/client-utils";
import { safeParse } from "../handlers/validation";
import { Agent } from "undici";

export type Issuer = z.infer<typeof issuer>;

export type GetById = {
  getById: (
    id: Issuer["id"],
    institutionId: Issuer["institutionId"]
  ) => TE.TaskEither<Error, O.Option<Issuer>>;
};

export const getById =
  (apiBasePath: string, apiKey: string) =>
  (id: Issuer["id"], institutionId: Issuer["institutionId"]) =>
    pipe(
      TE.tryCatch(
        () =>
          fetch(`${apiBasePath}/institutions/${institutionId}/issuers/${id}`, {
            method: "GET",
            headers: {
              ...defaultHeader,
              "Ocp-Apim-Subscription-Key": apiKey,
            },
            dispatcher: new Agent({
              keepAliveTimeout: 10,
              keepAliveMaxTimeout: 10,
            }),
          }),
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
              TE.flatMapEither(safeParse(issuer)),
              TE.map(O.some)
            )
      )
    );
