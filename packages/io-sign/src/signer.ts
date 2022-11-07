import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Id, id as newId } from "./id";
import { EntityNotFoundError } from "./error";

export const SignerId = Id;

export const Signer = t.type({
  id: SignerId,
});

export type Signer = t.TypeOf<typeof Signer>;

export const newSigner = () => ({
  id: newId(),
});

export type GetSignerByFiscalCode = (
  fiscalCode: FiscalCode
) => TE.TaskEither<Error, O.Option<Signer>>;

export type GetSigner = (
  id: Signer["id"]
) => TE.TaskEither<Error, O.Option<Signer>>;

export const signerNotFoundError = new EntityNotFoundError("Signer");
