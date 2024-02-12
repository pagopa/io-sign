import { cache } from "react";

import { getSelfcareApiClient } from "./selfcare";

export const getInstitution = cache((id: string) =>
  getSelfcareApiClient().getInstitution(id)
);

export const getInstitutionsByUserId = cache((uid: string) =>
  getSelfcareApiClient().getInstitutions(uid)
);

export const getProductsByInstitutionId = cache((uid: string, iid: string) =>
  getSelfcareApiClient().getProducts(uid, iid)
);

export const getUsersByInstitutionId = cache((iid: string) =>
  getSelfcareApiClient().getUsers(iid)
);
