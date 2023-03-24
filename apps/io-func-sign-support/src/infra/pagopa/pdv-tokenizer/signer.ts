import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { SignerRepository } from "../../../signer";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";

export class PdvTokenizerSignerRepository implements SignerRepository {
  #client: PdvTokenizerClientWithApiKey;

  constructor(client: PdvTokenizerClientWithApiKey) {
    this.#client = client;
  }

  getByFiscalCode(fiscalCode: FiscalCode) {
    const getSignerByFiscalCode = makeGetSignerByFiscalCode(this.#client);
    return getSignerByFiscalCode(fiscalCode);
  }
}
