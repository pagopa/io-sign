import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe, flow } from "fp-ts/function";
import { lookup } from "fp-ts/Record";

import * as H from "@pagopa/handler-kit";

import { SignatureRequestId } from "@io-sign/io-sign/signature-request";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import {
  getSignatureRequestById,
  GetSignatureRequestByIdPayload,
} from "../../../signature-request";

import {
  getIssuerByVatNumber,
  GetIssuerByVatNumberEnvironment,
} from "../../../issuer";

import { getSignerByFiscalCode } from "../../../signer";

import { RequireFiscalCodeOrVatNumber } from "../models/RequireFiscalCodeOrVatNumber";
import { signatureRequestToApiModel } from "../encoders/signature-request";

export const GetSignatureRequestHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.Do,
    RTE.bind("body", () =>
      pipe(req.body, H.parse(RequireFiscalCodeOrVatNumber), RTE.fromEither),
    ),
    RTE.bind("id", () =>
      pipe(
        req.path,
        lookup("id"),
        RTE.fromOption(
          (): Error =>
            new H.HttpBadRequestError('Missing "id" path parameter.'),
        ),
        RTE.chainEitherKW(H.parse(SignatureRequestId)),
      ),
    ),
    RTE.chainW(({ body, id }) =>
      pipe(
        // the body can contain the "vat_number" of an issuer or
        // the fiscal code of an user.
        "vat_number" in body
          ? pipe(
              getIssuerByVatNumber(body.vat_number),
              RTE.map((issuer) => ({ id, issuerId: issuer.id })),
            )
          : pipe(
              // we are in a "branched chain", so we make sure that
              // each branch requires the same dependencies
              RTE.ask<GetIssuerByVatNumberEnvironment>(),
              RTE.chainW(() => getSignerByFiscalCode(body.fiscal_code)),
              RTE.map((signer) => ({ id, signerId: signer.id })),
            ),
        RTE.chainEitherKW(H.parse(GetSignatureRequestByIdPayload)),
      ),
    ),
    RTE.chainW(
      flow(getSignatureRequestById, RTE.map(signatureRequestToApiModel)),
    ),
    RTE.map(H.successJson),
    RTE.orElseW(logErrorAndReturnResponse),
  ),
);
