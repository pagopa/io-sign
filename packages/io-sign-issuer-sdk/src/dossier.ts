import {
  Configuration,
  DossierApi,
  GetDossierRequest,
} from "@io-sign/io-sign-api-client";

export const callDossier = async (
  configuration: Configuration,
  dossier: GetDossierRequest
) => {
  const request: GetDossierRequest = {
    id: dossier.id,
  };
  const api = new DossierApi(configuration);
  return api.getDossier(request);
};
