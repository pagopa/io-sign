import { cache } from "react";

import { getSelfcareApiClient } from "./selfcare";

export const getInstitution = cache((id: string) =>
  getSelfcareApiClient().getInstitution(id)
);

export const getUserInstitutions = cache((uid: string) =>
  getSelfcareApiClient().getInstitutions(uid)
);

export const getUserProductsByInstitutionId = cache(
  (uid: string, iid: string) => getSelfcareApiClient().getProducts(uid, iid)
);
