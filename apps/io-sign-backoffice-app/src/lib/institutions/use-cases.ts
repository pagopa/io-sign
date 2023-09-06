import { getLoggedUser } from "@/lib/auth/use-cases";
import { getSelfCareApiClient } from "./selfcare";

export async function getInstitutions() {
  const loggedUser = await getLoggedUser();
  return getSelfCareApiClient().getInstitutions(loggedUser.id);
}

export async function getInstitution(id: string) {
  return getSelfCareApiClient().getInstitution(id);
}
