import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

import { flow, pipe } from "fp-ts/lib/function";
import { lookup } from "fp-ts/Record";
import { sequenceS } from "fp-ts/lib/Apply";

import { Database } from "@azure/cosmos";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetSignerByFiscalCode } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { makeGetSignatureRequest } from "../../azure/cosmos/signature-request";
import { requireSignatureRequestId } from "../decoders/signature-request";
import { SignatureRequestToThirdPartyMessage } from "../encoders/signature-request";

const requireFiscalCode = (req: H.HttpRequest): E.Either<Error, FiscalCode> =>
  pipe(
    req.headers,
    lookup("fiscal_code"),
    E.fromOption(
      () => new H.HttpBadRequestError("Missing fiscal_code in header")
    ),
    E.chainW(H.parse(FiscalCode, "Invalid fiscal code"))
  );

type GetThirdPartyMessageDetailsDependencies = {
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  db: Database;
};

export const GetThirdPartyMessageDetailsHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      fiscalCode: RTE.fromEither(requireFiscalCode(req)),
      signatureRequestId: requireSignatureRequestId(req)
    }),
    RTE.chainW(
      ({ fiscalCode, signatureRequestId }) =>
        ({
          pdvTokenizerClient,
          db
        }: GetThirdPartyMessageDetailsDependencies) => {
          const getSignerByFiscalCode =
            makeGetSignerByFiscalCode(pdvTokenizerClient);
          const getSignatureRequest = makeGetSignatureRequest(db);
          return pipe(
            fiscalCode,
            getSignerByFiscalCode,
            TE.chain(
              TE.fromOption(
                () =>
                  new EntityNotFoundError(
                    "The specified signer does not exist."
                  )
              )
            ),
            TE.map((signer) => signer.id),
            TE.chain(getSignatureRequest(signatureRequestId)),
            TE.chain(
              TE.fromOption(
                () =>
                  new EntityNotFoundError(
                    "The specified Signature Request does not exist."
                  )
              )
            )
          );
        }
    ),
    RTE.chainEitherKW(
      H.parse(
        SignatureRequestSigned,
        "The signature request must be in SIGNED status."
      )
    ),
    RTE.map(flow(SignatureRequestToThirdPartyMessage.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
