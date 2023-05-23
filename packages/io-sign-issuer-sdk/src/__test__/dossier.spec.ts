import { Configuration, DossierApi } from "@io-sign/io-sign-api-client";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { callDossier } from "./../dossier";
import { APIMiddleware } from "../middleware";
vi.mock('@io-sign/io-sign-api-client/src/apis/DossierApi', async () => {
  // can import the same module inside and does not go into an infinite loop
const dossierApiMock = await import('@io-sign/io-sign-api-client/src/apis/DossierApi')
return {
  default: {
    ...dossierApiMock.DossierApi,
    getDossier: vi.fn(),
      createDossier: vi.fn(),
    },
  }
});

const configuration = new Configuration({
  basePath: "https://example.com",
  apiKey: "aaa",
  fetchApi: fetch,
  middleware: [new APIMiddleware()],
});
const dossier = {
  id: 1,
  name: "Test Dossier",
};
describe('Dossier APIs', () => {
 
test('makes a GET request to fetch a single dossier and returns the result', async () => {

  vi.fn().mockResolvedValue(dossier)
  const request = {
    id: "aaa",
  };

  const dossierReturned = await callDossier(configuration, request);

  expect (dossierReturned).toStrictEqual(dossier)
})

test('makes a POST request to create a dossier', async () => {
  vi.fn().mockResolvedValue(dossier)
  const request ={
    title: "title",
    documentsMetadata: [
      {
        title: "document title",
        signatureFields: [],
      },
    ],
  };

  const dossierReturned = await callDossier(configuration, request);

  expect (dossierReturned).toStrictEqual(dossier)

})
})