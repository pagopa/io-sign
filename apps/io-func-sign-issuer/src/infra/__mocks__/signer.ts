import {
  GetSigner,
  GetSignerByFiscalCode,
  newSigner,
  Signer,
} from "@internal/io-sign/signer";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

const cache = new Map<FiscalCode, Signer>();

export const mockGetSignerByFiscalCode: GetSignerByFiscalCode = (
  fiscalCode
) => {
  const cached = cache.get(fiscalCode);
  if (typeof cached !== "undefined") {
    return TE.right(O.some(cached));
  }
  const signer = newSigner();
  cache.set(fiscalCode, signer);
  return TE.right(O.some(signer));
};

export const mockGetSigner: GetSigner = (id) => {
  for (const signer of cache.values()) {
    if (id === signer.id) {
      return TE.right(O.some(signer));
    }
  }
  return TE.right(O.none);
};
