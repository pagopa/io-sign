import {
  Configuration,
  DossierApi,
  CreateDossierRequest,
  GetDossierRequest,
  GetRequestsByDossierRequest,
} from "@io-sign/io-sign-api-client";

export const callDossier = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dossier: any
) => {
  if (dossier.id != null) {
    const api = new DossierApi(configuration);
    const request: GetDossierRequest = {
      id: dossier.id,
    };
    return api.getDossier(request);
  } else {
    return createDossier(configuration, dossier);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createDossier = async (configuration: Configuration, dossier: any) => {
  const api = new DossierApi(configuration);

  const request: CreateDossierRequest = {
    createDossierBody: dossier,
  };

  return api.createDossier(request);
};

export const callGetRequestsByDossier = async (
  configuration: Configuration,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: Partial<GetRequestsByDossierRequest>
) => {
    const api = new DossierApi(configuration);
		return api.getRequestsByDossier(<GetRequestsByDossierRequest>request);
};