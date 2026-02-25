import { describe, it, expect } from "vitest";
import * as E from "fp-ts/Either";
import * as H from "@pagopa/handler-kit";
import { AssertionTypeEnum } from "../../models/AssertionType";
import { requireBasicLollipopParams } from "../lollipop";

// A LolliPoP valid SignatureInput with multiple signature
const aValidMultiSignatureInput = `sig1=("@method" "@authority" "@path" "content-digest" "content-type" "content-length" "x-pagopa-original-url" "x-pagopa-original-method");created=1618884475;keyid="test-key-ecc-p256", sig2=("@method" "@authority" "@path" "content-digest" "content-type" "content-length" "forwarded");created=1618884480;keyid="test-key-rsa";alg="rsa-v1_5-sha256";expires=1618884540`;

const mockedLollipopRequest = (aSignatureInput: string): H.HttpRequest => ({
  url: "https://example.com",
  method: "POST",
  path: {},
  query: {},
  headers: {
    "signature-input": aSignatureInput,
    signature: "sig1=:asignature1:, sig2=:asignature2:",
    "x-pagopa-lollipop-auth-jwt": "aJWT",
    "x-pagopa-lollipop-assertion-ref": "sha256-anAssertionRef",
    "x-pagopa-lollipop-assertion-type": AssertionTypeEnum.SAML,
    "x-pagopa-lollipop-public-key": "aPubkey"
  },
  body: undefined
});

// The following string is an example of input value that can execute a ReDOS
// attack over the old regex "^(((sig[0-9]+)=[^,]*?)(, ?)?)+$"
const attackValue = "sig0=, " + "sig0=sig0=, ".repeat(27) + ",s";
const anInvalidSignatureInput = `anInvalidStringInput`;

describe("requireBasicLollipopParams", () => {
  it("should decode successfully a valid signature-input string", () => {
    const result = requireBasicLollipopParams(
      mockedLollipopRequest(aValidMultiSignatureInput)
    );
    expect(E.isRight(result)).toBeTruthy();
  });

  it("should return an error if an invalid signatur-input is provided", () => {
    const result = requireBasicLollipopParams(
      mockedLollipopRequest(anInvalidSignatureInput)
    );
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should be safe process a string that cause a ReDOS on the old regex ^(((sig[0-9]+)=[^,]*?)(, ?)?)+$", () => {
    const result = requireBasicLollipopParams(
      mockedLollipopRequest(attackValue)
    );
    expect(E.isLeft(result)).toBeTruthy();
  });
});
