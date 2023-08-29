import { getLoggedUser } from "@/lib/auth/user";
import { getInstitutions, getProducts } from "@/lib/selfcare/api";
import { useContext } from "react";

import InstitutionContext from "@/context/institution";
import { getConfig } from "@/config";

import ClientHeader from "./ClientHeader";
import { useTranslations } from "next-intl";
import { RootLinkType } from "@pagopa/mui-italia";

async function Content({
  institutionId,
  rootLink,
}: {
  institutionId: string;
  rootLink: RootLinkType;
}) {
  const loggedUser = await getLoggedUser();
  const [institutions, products] = await Promise.all([
    getInstitutions(loggedUser.id),
    getProducts(loggedUser.id, institutionId),
  ]);
  const config = getConfig();
  return (
    <ClientHeader
      loggedUser={loggedUser}
      institutions={institutions}
      currentInstitutionId={institutionId}
      products={products}
      supportUrl={config.selfCare.portal.supportUrl}
      documentationUrl={config.documentationUrl}
      rootLink={rootLink}
    />
  );
}

export default function Header({ rootLink }: { rootLink: RootLinkType }) {
  const institutionId = useContext(InstitutionContext);
  if (!institutionId) {
    throw new Error("...");
  }
  return (
    <header>
      <Content rootLink={rootLink} institutionId={institutionId} />
    </header>
  );
}
