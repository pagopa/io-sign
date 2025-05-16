import { z } from "zod";

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { issuerSchema } from "@io-sign/io-sign/issuer";

export type Issuer = z.TypeOf<typeof issuerSchema>;

export type IssuerKey = Pick<Issuer, "id" | "institutionId">;

export type IssuerRepository = {
  getIssuerByKey(k: IssuerKey): Promise<Issuer | undefined>;
};

export type IssuerEnvironment = {
  issuerRepository: IssuerRepository;
};

export const getIssuerTE = (repo: IssuerRepository, k: IssuerKey) =>
  TE.tryCatch(
    () => repo.getIssuerByKey(k),
    () => new Error("Error retrieving the Issuer.")
  );

export const getIssuer = (k: IssuerKey) => (r: IssuerEnvironment) =>
  pipe(
    getIssuerTE(r.issuerRepository, k),
    TE.flatMap(TE.fromNullable(new EntityNotFoundError("Issuer not found.")))
  );

export const issuerAlreadyExists = (k: IssuerKey) => (r: IssuerEnvironment) =>
  pipe(
    getIssuerTE(r.issuerRepository, k),
    TE.map((apiKey) => typeof apiKey !== "undefined")
  );
