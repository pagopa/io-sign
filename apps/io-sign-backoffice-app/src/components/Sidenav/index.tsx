import { useContext } from "react";
import { useTranslations } from "next-intl";
import { getConfig } from "@/config";

import InstitutionContext from "@/context/institution";

import {
  SupervisedUserCircleRounded,
  PeopleRounded,
  VpnKey,
  DashboardCustomize,
} from "@mui/icons-material";

import ClientSidenav from "./ClientSidenav";

export default function Sidenav() {
  const t = useTranslations();
  const c = getConfig();

  const institutionId = useContext(InstitutionContext);

  const items = [
    {
      title: t("firmaconio.overview.title"),
      icon: DashboardCustomize,
      segment: null,
      href: `/${institutionId}`,
    },
    {
      title: t("firmaconio.apiKeys.title"),
      icon: VpnKey,
      segment: "api-keys",
      href: `/${institutionId}/api-keys`,
    },
  ];
  const external = [
    {
      title: "Utenti",
      icon: PeopleRounded,
      href: new URL(`${institutionId}/users`, c.selfCare.portal.url).href,
    },
    {
      title: "Gruppi",
      icon: SupervisedUserCircleRounded,
      href: new URL(`${institutionId}/groups`, c.selfCare.portal.url).href,
    },
  ];
  return <ClientSidenav pages={items} external={external} />;
}
