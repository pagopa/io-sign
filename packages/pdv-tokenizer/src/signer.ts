import { GetSignerByFiscalCode } from "@internal/io-sign/signer";

import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const makeGetSignerByFiscalCode =
  (): GetSignerByFiscalCode => (fiscalCode) =>
    TE.right(
      O.some({
        id: `${fiscalCode}-signer` as NonEmptyString,
      })
    );
