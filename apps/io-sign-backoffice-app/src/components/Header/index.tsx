import { useContext, use } from "react";

import { RootLinkType } from "@pagopa/mui-italia";

import { getConfig } from "@/config";

import { getLoggedUser } from "@/lib/auth/use-cases";
import { getInstitutions } from "@/lib/institutions/use-cases";

import ClientHeader from "./ClientHeader";

export type Props = {
  institutionId: string;
  rootLink: RootLinkType;
};

export default function Header({ rootLink, institutionId }: Props) {
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
