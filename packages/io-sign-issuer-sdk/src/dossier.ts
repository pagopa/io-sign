import {
  Configuration,
  DossierApi,
  GetDossierRequest,
} from "@io-sign/io-sign-api-client";

export const callDossiers = async (configuration: Configuration, dossier: any) => {
	  const request: GetDossierRequest = {
	  id: dossier.id
	  };

    await callGetDossier(configuration, request);
};
const callGetDossier = async (configuration: Configuration, request: GetDossierRequest) => {
  const api = new DossierApi(configuration);
  return api.getDossier(request);
};
