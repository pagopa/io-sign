import {
  BlobServiceClient,
  ServiceGetUserDelegationKeyResponse
} from "@azure/storage-blob";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { describe, expect, it, vi } from "vitest";
import {
  defaultBlobGenerateSasUrlOptions,
  generateSasUrlFromBlob,
  withExpireInMinutes,
  withPermissions
} from "../blob";

describe("user delegation SAS with the Azure SDK", () => {
  it.each(["r", "racw"])(
    "signs a blob URL with %s permissions",
    async (permissions) => {
      const service = new BlobServiceClient(
        "https://account.blob.core.windows.net"
      );
      const blob = service
        .getContainerClient("documents")
        .getBlobClient("document.pdf");
      const options = pipe(
        defaultBlobGenerateSasUrlOptions(),
        withPermissions(permissions),
        withExpireInMinutes(15)
      );
      if (!options.startsOn || !options.expiresOn)
        throw new Error("Missing validity");
      const delegation = vi
        .spyOn(service, "getUserDelegationKey")
        .mockResolvedValue({
          signedObjectId: "00000000-0000-0000-0000-000000000001",
          signedTenantId: "00000000-0000-0000-0000-000000000002",
          signedStartsOn: options.startsOn,
          signedExpiresOn: options.expiresOn,
          signedService: "b",
          signedVersion: "2025-07-05",
          value: Buffer.from("test-delegation-key").toString("base64")
        } as ServiceGetUserDelegationKeyResponse);

      const result = await generateSasUrlFromBlob(options, service)(blob)();
      expect(E.isRight(result)).toBe(true);
      if (E.isLeft(result)) throw result.left;
      const url = new URL(result.right);
      expect(url.pathname).toBe("/documents/document.pdf");
      expect(url.searchParams.get("sp")).toBe(permissions);
      expect(url.searchParams.get("skoid")).toBe(
        "00000000-0000-0000-0000-000000000001"
      );
      expect(url.searchParams.get("sig")).toBeTruthy();
      expect(delegation).toHaveBeenCalledWith(
        options.startsOn,
        options.expiresOn
      );
    }
  );
});
