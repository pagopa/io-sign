import { Signer } from "@io-sign/io-sign/signer";
import { Issuer } from "@io-sign/io-sign/issuer";

import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { Dossier } from "../../dossier";
import {
  defaultExpiryDate,
  InsertSignatureRequest,
  newSignatureRequest,
  withExpiryDate,
} from "../../signature-request";

export type CreateSignatureRequestPayload = {
  dossier: Dossier;
  signer: Signer;
  expiresAt: O.Option<Date>;
  issuer: Issuer;
};

export const makeCreateSignatureRequest =
  (insertSignatureRequest: InsertSignatureRequest) =>
  ({ dossier, signer, expiresAt, issuer }: CreateSignatureRequestPayload) =>
    pipe(
      newSignatureRequest(dossier, signer, issuer),
      withExpiryDate(pipe(expiresAt, O.getOrElse(defaultExpiryDate))),
      TE.fromEither,
      TE.chain(insertSignatureRequest)
    );
