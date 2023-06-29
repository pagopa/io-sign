import { Configuration, DossierApi } from "@io-sign/io-sign-api-client";

import { describe, expect, test, vi } from "vitest";
import { callDossier, callGetRequestsByDossier } from "./../dossier";

vi.mock("@io-sign/io-sign-api-client");

const mockGetDossier = vi.spyOn(DossierApi.prototype, "getDossier");
const mockCreateDossier = vi.spyOn(DossierApi.prototype, "createDossier");
const mockGetRequestsByDossier = vi.spyOn(
  DossierApi.prototype,
  "getRequestsByDossier"
);

describe("Dossier APIs", () => {
  test("makes a GET request to fetch a single dossier and returns the result", async () => {
    const request = {
      id: "aaa",
    };

    await callDossier({} as Configuration, request);

    expect(mockGetDossier).toHaveBeenCalledWith(request);
  });

  test("makes a POST request to create a dossier", async () => {
    const request = {
      title: "title",
      documentsMetadata: [
        {
          title: "document title",
          signatureFields: [],
        },
      ],
    };

    await callDossier({} as Configuration, request);

    expect(mockCreateDossier).toHaveBeenCalledWith({
      createDossierBody: request,
    });
  });

  test("makes a GET request to fetch all signature requests linked to a single dossier", async () => {
    const request = {
      id: "aaa",
    };

    await callGetRequestsByDossier({} as Configuration, request);

    expect(mockGetRequestsByDossier).toHaveBeenCalledWith(request);
  });
});
