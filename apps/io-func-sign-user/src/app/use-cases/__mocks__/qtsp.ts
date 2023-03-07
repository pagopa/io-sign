import * as crypto from "crypto";

import * as jose from "jose";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";

import { getPdfFieldsValue } from "@io-sign/io-sign/infra/pdf";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { validate } from "@io-sign/io-sign/validation";
import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import { sequenceS } from "fp-ts/lib/Apply";
import { QtspClauses, QtspCreateSignaturePayload } from "../../../qtsp";

const MOCK_KEY_ID = "cZHpXWy9TJ4AlV7uPSra4o6ojTel5wQPvWhJOui7Wb4";
const TOS_CHALLENGE_HEADER_NAME = "x-pagopa-lollipop-custom-tos-challenge";
const SIGN_CHALLENGE_HEADER_NAME = "x-pagopa-lollipop-custom-sign-challenge";
const MOCKED_NONCE = "mockedNonce";
const CRYPTO_ALG = "ES256";

type ValueWithParams = {
  value: string;
  signatureParams: string;
};

const getSignatureParams = (
  headerName: string,
  timestamp: number,
  nonce: string
) =>
  `("${headerName}");created=${timestamp};nonce="${nonce}";alg="ecdsa-p256-sha256";keyid="${MOCK_KEY_ID}"`;

const createValueToSign =
  (headerName: string, timestamp: number, nonce: string) =>
  (hexValue: string): ValueWithParams => {
    const signatureParams = getSignatureParams(headerName, timestamp, nonce);
    return {
      signatureParams: getSignatureParams(headerName, timestamp, nonce),
      value: `"${headerName}": ${hexValue}\n"@signature-params": ${signatureParams}`,
    };
  };

const sign = (privateKey: jose.KeyLike) => (value: string) =>
  pipe(
    TE.tryCatch(
      () =>
        new jose.CompactSign(new TextEncoder().encode(value))
          .setProtectedHeader({ alg: CRYPTO_ALG })
          .sign(privateKey),
      E.toError
    )
  );

const signatureSequence =
  (privateKey: jose.KeyLike) => (valueWithParams: ValueWithParams) =>
    sequenceS(TE.ApplicativeSeq)({
      value: pipe(valueWithParams.value, sign(privateKey)),
      signatureParams: TE.of(valueWithParams.signatureParams),
    });

const getCurrentTimeStamp = () => Math.floor(Date.now() / 1000);

const getFileDigest = (
  url: string,
  fetchWithTimeout = makeFetchWithTimeout()
) =>
  pipe(
    TE.tryCatch(() => fetchWithTimeout(url), E.toError),
    TE.chain((response) => TE.tryCatch(() => response.blob(), E.toError)),
    TE.chain((blob) => TE.tryCatch(() => blob.arrayBuffer(), E.toError)),
    TE.map((arrayBuffer) => Buffer.from(arrayBuffer)),
    TE.map((buffer) => crypto.createHash("sha256").update(buffer).digest("hex"))
  );

export const generateMockKeyPair = TE.tryCatch(
  () => jose.generateKeyPair(CRYPTO_ALG),
  E.toError
);

export const publicKeyToBase64 = (publicKey: jose.KeyLike) =>
  pipe(
    TE.tryCatch(() => jose.exportJWK(publicKey), E.toError),
    TE.map(JSON.stringify),
    TE.map((jwk) => Buffer.from(jwk, "utf-8").toString("base64"))
  );

const getPublicKeyThumbprint = (publicKey: jose.KeyLike) =>
  pipe(
    TE.tryCatch(() => jose.exportJWK(publicKey), E.toError),
    TE.chain((jwk) =>
      TE.tryCatch(() => jose.calculateJwkThumbprint(jwk), E.toError)
    )
  );

export const mockSpidAssertion =
  (fetchWithTimeout = makeFetchWithTimeout()) =>
  (spidAssertion: NonEmptyString, publicKey: jose.KeyLike) =>
  (qtspClauses: QtspClauses) =>
    pipe(
      sequenceS(TE.ApplicativeSeq)({
        fields: pipe(
          TE.tryCatch(
            () => fetchWithTimeout(qtspClauses.filledDocumentUrl),
            E.toError
          ),
          TE.chain((response) => TE.tryCatch(() => response.blob(), E.toError)),
          TE.chain((blob) => TE.tryCatch(() => blob.arrayBuffer(), E.toError)),
          TE.map((arrayBuffer) => Buffer.from(arrayBuffer)),
          TE.chain(
            getPdfFieldsValue([
              "QUADROB_name",
              "QUADROB_lastname",
              "QUADROB_email",
              "QUADROB_fiscalcode",
            ])
          )
        ),
        publicKeyThumbprint: getPublicKeyThumbprint(publicKey),
      }),

      TE.map(({ fields, publicKeyThumbprint }) => {
        const saml = Buffer.from(spidAssertion, "base64").toString("utf-8");
        return pipe(
          fields,
          A.reduce(saml, (finalSaml, current) =>
            finalSaml.replaceAll(
              current.fieldName,
              current.fieldValue.toUpperCase()
            )
          ),
          (decodedSaml) =>
            decodedSaml.replaceAll(
              "INRESPONSETO_FIELD",
              `sha256-${publicKeyThumbprint}`
            ),
          (decodedSaml) => Buffer.from(decodedSaml, "utf-8").toString("base64")
        );
      }),
      TE.chainEitherKW(
        validate(NonEmptyString, "Invalid mocked SAML assertion")
      )
    );

export const mockTosSignature =
  (privateKey: jose.KeyLike) => (qtspClauses: QtspClauses) =>
    pipe(
      qtspClauses.filledDocumentUrl,
      getFileDigest,
      TE.map(
        (documentDigest) =>
          qtspClauses.nonce +
          "+" +
          documentDigest +
          qtspClauses.acceptedClauses.reduce(
            (finalString, currentClause) =>
              finalString + "+" + currentClause.text,
            ""
          )
      ),
      TE.map((tos) => tos.replace(/\r\n/g, "")),
      TE.map((tosChallenge) =>
        crypto.createHash("sha256").update(tosChallenge).digest("hex")
      ),
      TE.map(
        createValueToSign(
          TOS_CHALLENGE_HEADER_NAME,
          getCurrentTimeStamp(),
          qtspClauses.nonce
        )
      ),
      TE.chain(signatureSequence(privateKey)),
      TE.map((challenge) => ({
        ...challenge,
        value: Buffer.from(challenge.value, "utf-8").toString("base64"),
      }))
    );

export const mockSignature =
  (privateKey: jose.KeyLike) =>
  (documentsToSign: QtspCreateSignaturePayload["documentsToSign"]) =>
    pipe(
      documentsToSign,
      A.map((document) =>
        pipe(
          getFileDigest(document.urlIn),
          TE.map((hash) => {
            const attributes = document.signatureFields
              .map((signatureField) =>
                "uniqueName" in signatureField.attributes
                  ? signatureField.attributes.uniqueName
                  : // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                    signatureField.attributes.page +
                    "-" +
                    signatureField.attributes.bottomLeft.x +
                    "-" +
                    signatureField.attributes.bottomLeft.y +
                    "-" +
                    signatureField.attributes.topRight.x +
                    "-" +
                    signatureField.attributes.topRight.y
              )
              .join("+");
            return hash + "+" + attributes;
          })
        )
      ),
      A.sequence(TE.ApplicativeSeq),
      TE.map((chellenges) => chellenges.join("+")),
      TE.map((challenge) => challenge.replace(/\r\n/g, "")),
      TE.map((challenge) =>
        crypto.createHash("sha256").update(challenge).digest("hex")
      ),
      TE.map(
        createValueToSign(
          SIGN_CHALLENGE_HEADER_NAME,
          getCurrentTimeStamp(),
          MOCKED_NONCE
        )
      ),
      TE.chain(signatureSequence(privateKey)),
      TE.map((challenge) => ({
        ...challenge,
        value: Buffer.from(challenge.value, "utf-8").toString("base64"),
      }))
    );

export const mockSignatureInput = (
  tosSignatureInput: string,
  signSignatureInput: string
): NonEmptyString =>
  pipe(
    `sig1=("content-digest" "content-type" "x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url");created=${getCurrentTimeStamp()};nonce="${MOCKED_NONCE}";alg="ecdsa-p256-sha256";keyid="${MOCK_KEY_ID}",sig2=${tosSignatureInput},sig3=${signSignatureInput}`,
    (signatureInput) =>
      Buffer.from(signatureInput, "utf-8").toString("base64") as NonEmptyString
  );
