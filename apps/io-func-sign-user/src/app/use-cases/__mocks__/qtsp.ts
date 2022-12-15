import * as crypto from "crypto";
import * as rs from "jsrsasign";

import * as cryptoJS from "crypto-js";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";

import { makeFetchWithTimeout } from "../../../infra/http/fetch-timeout";
import { QtspClauses, QtspCreateSignaturePayload } from "../../../qtsp";

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

const ec = new rs.KJUR.crypto.ECDSA({ curve: "secp256k1" });
const kp1 = rs.KEYUTIL.generateKeypair("EC", "secp256k1");

// The value in hexadecimal cannot be accessed directly and there is no function to do so. Therefore I disabled the controls!
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const prvhex = kp1.prvKeyObj.prvKeyHex;

export const mockPublicKey = () =>
  rs.KEYUTIL.getPEM(kp1.pubKeyObj).replace(/\r\n/g, "\\n");

export const mockTosSignature = (qtspClauses: QtspClauses) =>
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
    TE.map((tosChallengeHashHex) => ec.signHex(tosChallengeHashHex, prvhex)),
    TE.map((signatureHex) =>
      cryptoJS.enc.Base64.stringify(cryptoJS.enc.Hex.parse(signatureHex))
    )
  );

export const mockSignature = (
  documentsToSign: QtspCreateSignaturePayload["documentsToSign"]
) =>
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
    TE.map((challengeHashHex) => ec.signHex(challengeHashHex, prvhex)),
    TE.map((signatureHex) =>
      cryptoJS.enc.Base64.stringify(cryptoJS.enc.Hex.parse(signatureHex))
    )
  );
