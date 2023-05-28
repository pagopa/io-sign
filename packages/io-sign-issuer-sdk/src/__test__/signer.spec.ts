import {
  Configuration,
  SignerApi,
} from "@io-sign/io-sign-api-client";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { callSigners } from "../signer";

vi.mock("@io-sign/io-sign-api-client");
const mockGetSignerByFiscalCode = vi.spyOn(
  SignerApi.prototype,
  "getSignerByFiscalCode"
);

describe("Signer APIs", () => {
  test("makes a GET request to fetch the signer id", async () => {
    const request = "AAABBB99S01H501Z";

    await callSigners({} as Configuration, request);

    expect(mockGetSignerByFiscalCode).toHaveBeenCalledWith({
      getSignerByFiscalCodeBody: { fiscalCode: request },
    });
  });
});
