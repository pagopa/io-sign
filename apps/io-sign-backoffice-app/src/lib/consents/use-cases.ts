import { cache } from "react";
import assert from "node:assert";

import { getTOSAcceptance } from "./cosmos";
import { getLoggedUser } from "@/lib/auth/use-cases";

export { insertTOSAcceptance } from "./cosmos";

export const checkTOSAcceptance = cache(async (institutionId: string) => {
  try {
    const loggedUser = await getLoggedUser();
    const result = await getTOSAcceptance(loggedUser.id, institutionId);
    assert(result === true);
  } catch {
    throw new Error("User must accept the TOS to continue.");
  }
});
