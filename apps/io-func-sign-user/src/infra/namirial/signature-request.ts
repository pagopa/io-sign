import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { makeFetchWithTimeout } from "../http/fetch-timeout";
import { QtspCreateSignaturePayload } from "../../qtsp";
import { NamirialConfig } from "./config";

import {
  makeCreateSignatureRequest,
  makeGetSignatureRequest,
  makeGetToken,
} from "./client";
import { QtspCreateSignatureToApiModel } from "./encoders/signature-request";
import { SignatureRequest } from "./types/signature-request";

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
