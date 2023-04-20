import {
  Configuration,
  DossierApi,
  CreateDossierRequest,
  GetDossierRequest,
} from "@io-sign/io-sign-api-client";

export const callDossier = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dossier: any
) => {
  if (dossier.id != null) {
    const request: GetDossierRequest = {
      id: dossier.id,
    };
    const api = new DossierApi(configuration);
    return api.getDossier(request);
  } else {
    return createDossier(configuration, dossier);
  }
};

const createDossier = async (
  configuration: Configuration,
  dossier: any
) => {
  const api = new DossierApi(configuration);

const request: CreateDossierRequest  = {
	"createDossierBody": dossier
};

  return api.createDossier(request);
};
