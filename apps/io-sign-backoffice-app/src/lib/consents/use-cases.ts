import { getLoggedUser } from "@/lib/auth/use-cases";
import {
  getUserInstitutions,
  getUserProductsByInstitutionId,
} from "@/lib/institutions/use-cases";

import { getTOSAcceptance } from "./cosmos";

export { getTOSAcceptance };

export async function acceptTOS(institutionId: string) {
  try {
    const loggedUser = await getLoggedUser();
    const institutions = await getUserInstitutions(loggedUser.id);
  } catch (cause) {
    throw new Error("Unable to accept TOS", { cause });
  }
}
