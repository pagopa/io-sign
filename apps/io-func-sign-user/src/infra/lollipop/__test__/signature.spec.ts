import { describe, it, expect } from "@jest/globals";

import { pipe } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import {
  getSignatureFromHeaderName,
  getSignatureFromPrefix,
  getSignaturePrefixFromHeaderName,
  LollipopSignaturePrefix,
} from "../signature";
import { LollipopSignatureInput } from "../../http/models/LollipopSignatureInput";
import { LollipopSignature } from "../../http/models/LollipopSignature";

const signature1 =
  "MEYCIQD1BPMD/2kOE+zGCySXyUjvKjyK17X6dR4ZKoNJaau3FgIhAJnshmM3xIOxMJlAJxOUUx8TDfGIBkOjfZC1uC3gWD3Z";
const signature2 =
  "MEUCIBt8MzxjCdoTJiIqvQ0HAMKwXPahqjhK1k3iXj8fS6OLAiEA5WvRTvb/BVQwTUud+bcoNLSgBGoH/s4MwDY8Oom/+7E=";
const signature3 =
  "MEYCIQDKfk8cVxZaW/cZpTH82IjG0PCxbqlRZFa88/Tpwb2RMgIhAMkvojd6p8M2JE84EtiGu+O18W28MhcyCMbTd032JY/M";

const signatureInput =
  `sig1=("content-digest" "content-type" "x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url");created=1678291148;nonce="EqFCeljdHZI+N0HW7+eYOKmvzLNHiPbQGFU8RieANaVfFMfAQcweiqoZnp2nKyPCp4pp3/GNS/5qJn4VzukmmEKKDlXDD8jHyzkUvJF/7EHK5c6ZFgrtMCa6PFBi5uu23jQuKAHZZI5v4YiiB0LfzYumVFFHVkfBNGaBPtLP+h8/ebW8/S/xycmCFfbV2fuEG/UrLygUNJewPBKFx8fbFY6YVC+tdT3gNDIKwxOyhAxqD5ggQZyXVStKR9tGAwKiU5/7pXxUV4yaDvAIDTB3UsMfI/HIRwwh3BuSQNsLeXlFLX/x/KbgONM2o/pUWGyLLb3rPbSSFossmw7LOIgrKA==";alg="ecdsa-p256-sha256";keyid="sWAcliTWPaDrAwhfaEfLYXBPIHscDiIPtPRiUOgpxY8",sig2=("x-pagopa-lollipop-custom-tos-challenge");created=1678291148;nonce="EqFCeljdHZI+N0HW7+eYOKmvzLNHiPbQGFU8RieANaVfFMfAQcweiqoZnp2nKyPCp4pp3/GNS/5qJn4VzukmmEKKDlXDD8jHyzkUvJF/7EHK5c6ZFgrtMCa6PFBi5uu23jQuKAHZZI5v4YiiB0LfzYumVFFHVkfBNGaBPtLP+h8/ebW8/S/xycmCFfbV2fuEG/UrLygUNJewPBKFx8fbFY6YVC+tdT3gNDIKwxOyhAxqD5ggQZyXVStKR9tGAwKiU5/7pXxUV4yaDvAIDTB3UsMfI/HIRwwh3BuSQNsLeXlFLX/x/KbgONM2o/pUWGyLLb3rPbSSFossmw7LOIgrKA==";alg="ecdsa-p256-sha256";keyid="sWAcliTWPaDrAwhfaEfLYXBPIHscDiIPtPRiUOgpxY8",sig3=("x-pagopa-lollipop-custom-sign-challenge");created=1678291148;nonce="EqFCeljdHZI+N0HW7+eYOKmvzLNHiPbQGFU8RieANaVfFMfAQcweiqoZnp2nKyPCp4pp3/GNS/5qJn4VzukmmEKKDlXDD8jHyzkUvJF/7EHK5c6ZFgrtMCa6PFBi5uu23jQuKAHZZI5v4YiiB0LfzYumVFFHVkfBNGaBPtLP+h8/ebW8/S/xycmCFfbV2fuEG/UrLygUNJewPBKFx8fbFY6YVC+tdT3gNDIKwxOyhAxqD5ggQZyXVStKR9tGAwKiU5/7pXxUV4yaDvAIDTB3UsMfI/HIRwwh3BuSQNsLeXlFLX/x/KbgONM2o/pUWGyLLb3rPbSSFossmw7LOIgrKA==";alg="ecdsa-p256-sha256";keyid="sWAcliTWPaDrAwhfaEfLYXBPIHscDiIPtPRiUOgpxY8` as LollipopSignatureInput;
const sigantures =
  `sig1=:${signature1}:,sig2=:${signature2}:,sig3=:${signature3}:` as LollipopSignature;

describe("lollipop infra: getSignatureFromHeaderName", () => {
  it("should return correct signature for x-pagopa-lollipop-custom-tos-challenge", () => {
    expect(
      pipe(
        getSignatureFromHeaderName(
          signatureInput,
          sigantures,
          "x-pagopa-lollipop-custom-tos-challenge"
        ),
        E.getOrElse(() => "INVALID")
      )
    ).toBe(signature2);
  });
  it("should return correct signature for x-pagopa-lollipop-custom-sign-challenge", () => {
    expect(
      pipe(
        getSignatureFromHeaderName(
          signatureInput,
          sigantures,
          "x-pagopa-lollipop-custom-sign-challenge"
        ),
        E.getOrElse(() => "INVALID")
      )
    ).toBe(signature3);
  });
  it("should fail for x-pagopa-lollipop-custom-invalid", () => {
    expect(
      pipe(
        getSignatureFromHeaderName(
          signatureInput,
          sigantures,
          "x-pagopa-lollipop-custom-invalid"
        ),
        E.getOrElse(() => "INVALID")
      )
    ).toBe("INVALID");
  });
});
describe("lollipop infra: getSignaturePrefixFromHeaderName", () => {
  it("should return correct signature prefix for x-pagopa-lollipop-custom-tos-challenge header name", () => {
    expect(
      pipe(
        "x-pagopa-lollipop-custom-tos-challenge",
        getSignaturePrefixFromHeaderName(signatureInput),
        O.getOrElse(() => "INVALID")
      )
    ).toBe("sig2=");
  });

  it("should return correct signature prefix for x-pagopa-lollipop-custom-sign-challenge header name", () => {
    expect(
      pipe(
        "x-pagopa-lollipop-custom-sign-challenge",
        getSignaturePrefixFromHeaderName(signatureInput),
        O.getOrElse(() => "INVALID")
      )
    ).toBe("sig3=");
  });
  it("should fail for x-pagopa-lollipop-custom-invalid header name", () => {
    expect(
      pipe(
        "x-pagopa-lollipop-custom-invalid",
        getSignaturePrefixFromHeaderName(signatureInput),
        O.getOrElse(() => "INVALID")
      )
    ).toBe("INVALID");
  });
});

describe("lollipop infra: getSignatureFromPrefix", () => {
  it("should return correct signature for sig2 prefix", () => {
    expect(
      pipe(
        "sig2=" as LollipopSignaturePrefix,
        getSignatureFromPrefix(sigantures),
        O.getOrElse(() => "INVALID")
      )
    ).toBe(signature2);
  });

  it("should return correct signature for sig1 prefix", () => {
    expect(
      pipe(
        "sig1=" as LollipopSignaturePrefix,
        getSignatureFromPrefix(sigantures),
        O.getOrElse(() => "INVALID")
      )
    ).toBe(signature1);
  });
  it("shouldfail for sig4 prefix", () => {
    expect(
      pipe(
        "sig4=" as LollipopSignaturePrefix,
        getSignatureFromPrefix(sigantures),
        O.getOrElse(() => "INVALID")
      )
    ).toBe("INVALID");
  });
});
