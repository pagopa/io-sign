import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { PdvTokenizerSignerRepository } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { SignerRepository } from "../../../signer";

export const makePdvTokenizerSignerRepository = (
  client: PdvTokenizerClientWithApiKey
): SignerRepository => {
  const base = new PdvTokenizerSignerRepository(client);
  return {
    getByFiscalCode: (fiscalCode: FiscalCode) =>
      pipe(base.getSignerByFiscalCode(fiscalCode), TE.map(O.some))
  };
};
