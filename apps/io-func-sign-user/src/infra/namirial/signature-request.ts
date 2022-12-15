import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { NonNegativeNumber } from "@pagopa/ts-commons/lib/numbers";
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";

import * as t from "io-ts";

import { makeFetchWithTimeout } from "../http/fetch-timeout";
import { QtspCreateSignaturePayload } from "../../qtsp";
import { NamirialConfig } from "./config";

import {
  makeCreateSignatureRequest,
  makeGetSignatureRequest,
  makeGetToken,
} from "./client";
import { QtspCreateSignatureToApiModel } from "./encoders/signature-request";

export const SignatureCoordinate = t.type({
  page: NonNegativeNumber,
  position: t.array(t.number),
});

export type SignatureCoordinate = t.TypeOf<typeof SignatureCoordinate>;

export const DocumentToSign = t.type({
  url_in: NonEmptyString,
  url_out: NonEmptyString,
  signature_fields: t.array(t.string),
  signature_coordinates: t.array(SignatureCoordinate),
  signatures_type: t.literal("PADES-T"),
  appearance_alias: t.literal("appio"),
});

export type DocumentToSign = t.TypeOf<typeof DocumentToSign>;

export const Signature = t.type({
  signed_challenge: t.string,
  signatures_type: t.literal("PADES"),
  documents_to_sign: t.array(DocumentToSign),
});

export type Signature = t.TypeOf<typeof Signature>;

export const CreateSignatureRequestBody = t.type({
  fiscal_code: FiscalCode,
  public_key: t.string,
  SAML_assertion: NonEmptyString,
  email: EmailString,
  document_link: NonEmptyString,
  nonce: NonEmptyString,
  tos_signature: t.string,
  signatures: Signature,
});

export type CreateSignatureRequestBody = t.TypeOf<
  typeof CreateSignatureRequestBody
>;

const SignatureRequestStatusV = t.keyof({
  CREATED: null,
  READY: null,
  WAITING: null,
  COMPLETED: null,
  FAILED: null,
});

export type SignatureRequestStatus = t.TypeOf<typeof SignatureRequestStatusV>;

export const SignatureRequest = t.type({
  id: NonEmptyString,
  created_at: IsoDateFromString,
  status: SignatureRequestStatusV,
  last_error: t.union([
    t.type({
      code: t.number,
      detail: t.string,
    }),
    t.null,
  ]),
});

export type SignatureRequest = t.TypeOf<typeof SignatureRequest>;

export type CreateSignatureRequest = (
  payload: QtspCreateSignaturePayload
) => TE.TaskEither<Error, SignatureRequest>;

export const makeCreateSignatureRequestWithToken =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (getToken: ReturnType<typeof makeGetToken>) =>
  (config: NamirialConfig): CreateSignatureRequest =>
  (createSignaturePayload: QtspCreateSignaturePayload) =>
    pipe(
      getToken(config),
      TE.chain((token) =>
        pipe(
          createSignaturePayload,
          QtspCreateSignatureToApiModel.encode,
          makeCreateSignatureRequest(fetchWithTimeout)(config)(token)
        )
      )
    );

export type GetSignatureRequest = (
  signatureRequestId: SignatureRequest["id"]
) => TE.TaskEither<Error, SignatureRequest>;

export const makeGetSignatureRequestWithToken =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (getToken: ReturnType<typeof makeGetToken>) =>
  (config: NamirialConfig) =>
  (signatureRequestId: SignatureRequest["id"]) =>
    pipe(
      getToken(config),
      TE.chain((token) =>
        makeGetSignatureRequest(fetchWithTimeout)(config)(token)(
          signatureRequestId
        )
      )
    );
