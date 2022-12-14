import * as crypto from "crypto";
import * as rs from "jsrsasign";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as cryptoJS from "crypto-js";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { makeFetchWithTimeout } from "../../../infra/http/fetch-timeout";
import { QtspClauses } from "../../../qtsp";

const getFileDigest = (url: string) => {
  const fetchWithTimeout = makeFetchWithTimeout();

  return pipe(
    TE.tryCatch(() => fetchWithTimeout(url), E.toError),
    TE.chain((response) => TE.tryCatch(() => response.blob(), E.toError)),
    TE.chain((blob) => TE.tryCatch(() => blob.arrayBuffer(), E.toError)),
    TE.map((arrayBuffer) => Buffer.from(arrayBuffer)),
    TE.map((buffer) => crypto.createHash("sha256").update(buffer).digest("hex"))
  );
};

const ec = new rs.KJUR.crypto.ECDSA({ curve: "secp256k1" });
const kp1 = rs.KEYUTIL.generateKeypair("EC", "secp256k1");
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

export const mockSignature =
  "MEUCIQDl1JDRRzaJq+Gn1NMkq0j5ajX94faDjrVPC3BGqy069gIgbts4/L9tagID9uEstAk4Eqa7/3Gxzo6XMi62rVifoa8=" as NonEmptyString;
