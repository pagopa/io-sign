import { useContext, use } from "react";

import { RootLinkType } from "@pagopa/mui-italia";

import { getConfig } from "@/config";

import { getLoggedUser } from "@/lib/auth/use-cases";
import { getInstitutions } from "@/lib/institutions/use-cases";
import InstitutionContext from "@/lib/institutions/context";

import ClientHeader from "./ClientHeader";

export default function Header({ rootLink }: { rootLink: RootLinkType }) {
  const institutionId = useContext(InstitutionContext);
  const loggedUser = use(getLoggedUser());
  const institutions = use(getInstitutions());
  const config = getConfig();
  const products = [
    {
      id: "prod-io-sign",
      title: "Firma con IO",
      linkType: "internal" as const,
      productUrl: "#",
    },
  ];
  return (
    <header>
      <ClientHeader
        loggedUser={loggedUser}
        institutions={institutions}
        currentInstitutionId={institutionId}
        products={products}
        supportUrl={config.selfCare.portal.supportUrl}
        documentationUrl={config.documentationUrl}
        rootLink={rootLink}
      />
    </header>
  );
}
