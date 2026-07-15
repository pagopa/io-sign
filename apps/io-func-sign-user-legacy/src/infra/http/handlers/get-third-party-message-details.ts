import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";

import { flow, pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { Database } from "@azure/cosmos";

import { SignerRepository } from "@io-sign/io-sign/signer";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { makeGetSignatureRequest } from "../../azure/cosmos/signature-request";
import { requireSignatureRequestId } from "../decoders/signature-request";
import { SignatureRequestToThirdPartyMessage } from "../encoders/signature-request";
import { requireFiscalCode } from "../decoders/fiscal-code";

type GetThirdPartyMessageDetailsDependencies = {
  signerRepository: SignerRepository;
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
        ({ signerRepository, db }: GetThirdPartyMessageDetailsDependencies) => {
          const getSignatureRequest = makeGetSignatureRequest(db);
          return pipe(
            signerRepository.getSignerByFiscalCode(fiscalCode),
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
