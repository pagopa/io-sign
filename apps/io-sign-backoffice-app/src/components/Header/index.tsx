import { getLoggedUser } from "@/lib/auth/use-cases";
import {
  getUserInstitutions,
  getUserProductsByInstitutionId,
} from "@/lib/institutions/use-cases";

import ClientHeader from "./ClientHeader";

export type Props = {
  institutionId: string;
};

export default async function Header({ institutionId }: Props) {
  const loggedUser = await getLoggedUser();
  const [institutions, products] = await Promise.all([
    getUserInstitutions(loggedUser.id),
    getUserProductsByInstitutionId(loggedUser.id, institutionId),
  ]);
  return (
    <ClientHeader
      loggedUser={loggedUser}
      institutions={institutions}
      institutionId={institutionId}
      products={products}
    />
  );
}
