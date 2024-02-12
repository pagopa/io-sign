import { getLoggedUser } from "@/lib/auth/use-cases";
import {
  getInstitutionsByUserId,
  getProductsByInstitutionId,
} from "@/lib/institutions/use-cases";

import ClientHeader from "./ClientHeader";

export type Props = {
  institutionId: string;
};

export default async function Header({ institutionId }: Props) {
  const loggedUser = await getLoggedUser();
  const [institutions, products] = await Promise.all([
    getInstitutionsByUserId(loggedUser.id),
    getProductsByInstitutionId(loggedUser.id, institutionId),
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
