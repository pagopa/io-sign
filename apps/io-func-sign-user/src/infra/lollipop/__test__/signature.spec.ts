import { describe, it, expect } from "@jest/globals";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import { getSignatureFromSingleHeaderName } from "../signature";
import { LollipopSignatureInput } from "../../http/models/LollipopSignatureInput";
import { LollipopSignature } from "../../http/models/LollipopSignature";

const signatureInput =
  `sig1=("content-digest" "content-type" "x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url");created=1678291148;nonce="EqFCeljdHZI+N0HW7+eYOKmvzLNHiPbQGFU8RieANaVfFMfAQcweiqoZnp2nKyPCp4pp3/GNS/5qJn4VzukmmEKKDlXDD8jHyzkUvJF/7EHK5c6ZFgrtMCa6PFBi5uu23jQuKAHZZI5v4YiiB0LfzYumVFFHVkfBNGaBPtLP+h8/ebW8/S/xycmCFfbV2fuEG/UrLygUNJewPBKFx8fbFY6YVC+tdT3gNDIKwxOyhAxqD5ggQZyXVStKR9tGAwKiU5/7pXxUV4yaDvAIDTB3UsMfI/HIRwwh3BuSQNsLeXlFLX/x/KbgONM2o/pUWGyLLb3rPbSSFossmw7LOIgrKA==";alg="ecdsa-p256-sha256";keyid="sWAcliTWPaDrAwhfaEfLYXBPIHscDiIPtPRiUOgpxY8",sig2=("x-pagopa-lollipop-custom-tos-challenge");created=1678291148;nonce="EqFCeljdHZI+N0HW7+eYOKmvzLNHiPbQGFU8RieANaVfFMfAQcweiqoZnp2nKyPCp4pp3/GNS/5qJn4VzukmmEKKDlXDD8jHyzkUvJF/7EHK5c6ZFgrtMCa6PFBi5uu23jQuKAHZZI5v4YiiB0LfzYumVFFHVkfBNGaBPtLP+h8/ebW8/S/xycmCFfbV2fuEG/UrLygUNJewPBKFx8fbFY6YVC+tdT3gNDIKwxOyhAxqD5ggQZyXVStKR9tGAwKiU5/7pXxUV4yaDvAIDTB3UsMfI/HIRwwh3BuSQNsLeXlFLX/x/KbgONM2o/pUWGyLLb3rPbSSFossmw7LOIgrKA==";alg="ecdsa-p256-sha256";keyid="sWAcliTWPaDrAwhfaEfLYXBPIHscDiIPtPRiUOgpxY8",sig3=("x-pagopa-lollipop-custom-sign-challenge");created=1678291148;nonce="EqFCeljdHZI+N0HW7+eYOKmvzLNHiPbQGFU8RieANaVfFMfAQcweiqoZnp2nKyPCp4pp3/GNS/5qJn4VzukmmEKKDlXDD8jHyzkUvJF/7EHK5c6ZFgrtMCa6PFBi5uu23jQuKAHZZI5v4YiiB0LfzYumVFFHVkfBNGaBPtLP+h8/ebW8/S/xycmCFfbV2fuEG/UrLygUNJewPBKFx8fbFY6YVC+tdT3gNDIKwxOyhAxqD5ggQZyXVStKR9tGAwKiU5/7pXxUV4yaDvAIDTB3UsMfI/HIRwwh3BuSQNsLeXlFLX/x/KbgONM2o/pUWGyLLb3rPbSSFossmw7LOIgrKA==";alg="ecdsa-p256-sha256";keyid="sWAcliTWPaDrAwhfaEfLYXBPIHscDiIPtPRiUOgpxY8` as LollipopSignatureInput;
const sigantures =
  `sig1=:MEYCIQD1BPMD/2kOE+zGCySXyUjvKjyK17X6dR4ZKoNJaau3FgIhAJnshmM3xIOxMJlAJxOUUx8TDfGIBkOjfZC1uC3gWD3Z:,sig2=:MEUCIBt8MzxjCdoTJiIqvQ0HAMKwXPahqjhK1k3iXj8fS6OLAiEA5WvRTvb/BVQwTUud+bcoNLSgBGoH/s4MwDY8Oom/+7E=:,sig3=:MEYCIQDKfk8cVxZaW/cZpTH82IjG0PCxbqlRZFa88/Tpwb2RMgIhAMkvojd6p8M2JE84EtiGu+O18W28MhcyCMbTd032JY/M:` as LollipopSignature;

describe("lollipop infra: getSignatureFromHeaderName", () => {
  it("should return correct signature for x-pagopa-lollipop-custom-tos-challenge", () => {
    expect(
      pipe(
        getSignatureFromSingleHeaderName(
          signatureInput,
          sigantures,
          "x-pagopa-lollipop-custom-tos-challenge"
        ),
        E.getOrElse(() => "INVALID")
      )
    ).toBe(
      "MEUCIBt8MzxjCdoTJiIqvQ0HAMKwXPahqjhK1k3iXj8fS6OLAiEA5WvRTvb/BVQwTUud+bcoNLSgBGoH/s4MwDY8Oom/+7E="
    );
  });
  it("should return correct signature for x-pagopa-lollipop-custom-sign-challenge", () => {
    expect(
      pipe(
        getSignatureFromSingleHeaderName(
          signatureInput,
          sigantures,
          "x-pagopa-lollipop-custom-sign-challenge"
        ),
        E.getOrElse(() => "INVALID")
      )
    ).toBe(
      "MEYCIQDKfk8cVxZaW/cZpTH82IjG0PCxbqlRZFa88/Tpwb2RMgIhAMkvojd6p8M2JE84EtiGu+O18W28MhcyCMbTd032JY/M"
    );
  });
  it("should fail for x-pagopa-lollipop-custom-invalid", () => {
    expect(
      pipe(
        getSignatureFromSingleHeaderName(
          signatureInput,
          sigantures,
          "x-pagopa-lollipop-custom-invalid"
        ),
        E.getOrElse(() => "INVALID")
      )
    ).toBe("INVALID");
  });
});
