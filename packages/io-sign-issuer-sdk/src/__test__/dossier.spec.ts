import { Configuration, DossierApi } from "@io-sign/io-sign-api-client";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { callDossier } from "./../dossier";
const fetchMock = vi.fn();
const configuration = new Configuration({
  basePath: "https://example.com",
  apiKey: "aaa",
  fetchApi: fetch,
  middleware: [],
});
const dossier = {
  id: 1,
  name: "Test Dossier",
};
describe('Dossier APIs', () => {
  const api = new DossierApi(configuration);
 
beforeEach(() => {
  fetchMock.mockReset()
})

test('makes a GET request to fetch a single dossier and returns the result', async () => {

  fetchMock.mockResolvedValue(dossier)

  const dossierReturned = await api.getDossier("asd");

  expect (dossierReturned).toStrictEqual(dossier)
})

test('makes a POST request to create a dossier', async () => {

  fetchMock.mockResolvedValue(dossier)

  const dossierReturned = await api.createDossier("asd");

  expect (dossierReturned).toStrictEqual(dossier)

})
})