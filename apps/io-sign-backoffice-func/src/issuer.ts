import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { issuerSchema } from "@io-sign/io-sign/issuer";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { z } from "zod";

export type Issuer = z.TypeOf<typeof issuerSchema>;

export type IssuerKey = Pick<Issuer, "id" | "institutionId">;

export interface IssuerRepository {
  getIssuerByKey(k: IssuerKey): Promise<Issuer | undefined>;
}

export interface IssuerEnvironment {
  issuerRepository: IssuerRepository;
}

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
