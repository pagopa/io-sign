// this mock does not work as intended due the split of the application entries
// it affects "createSignatureRequest"

import {
  GetSigner,
  GetSignerByFiscalCode,
  newSigner,
  Signer,
} from "@io-sign/io-sign/signer";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

const cache = new Map<FiscalCode, Signer>();

export const mockGetSignerByFiscalCode: GetSignerByFiscalCode = (
  fiscalCode,
) => {
  const cached = cache.get(fiscalCode);
  if (typeof cached !== "undefined") {
    return TE.right(O.some(cached));
  }
  const signer = newSigner();
  cache.set(fiscalCode, signer);
  return TE.right(O.some(signer));
};

export const mockGetSigner: GetSigner = (id) => TE.right(O.some({ id }));
