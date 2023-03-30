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
		await createDossier(configuration, dossier);
	}
};

const createDossier = async (
	configuration: Configuration, 
	dossier: CreateDossierRequest
) => {
  const api = new DossierApi(configuration);
  return api.createDossier(dossier);
};
