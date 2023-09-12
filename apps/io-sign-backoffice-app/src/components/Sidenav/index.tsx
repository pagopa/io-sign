"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useParams, usePathname } from "next/navigation";

import { Box, Divider, List } from "@mui/material";

import {
  SupervisedUserCircleRounded,
  PeopleRounded,
  VpnKey,
  DashboardCustomize,
} from "@mui/icons-material";

import SidenavItem from "./SidenavItem";

export default function Sidenav() {
  const t = useTranslations();
  const pathname = usePathname();
  const segment = useMemo(() => pathname.split("/").at(2) ?? null, [pathname]);
  const params = useParams();

  const institutionId = params.institution;

  const sections = [
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
      href: "#",
    },
    {
      title: "Gruppi",
      icon: SupervisedUserCircleRounded,
      href: "#",
    },
  ];

  return (
    <Box
      sx={{
        maxWidth: 300,
        flexGrow: 1,
        backgroundColor: "background.paper",
        py: 3,
      }}
    >
      <List component="nav">
        {sections.map((item, i) => (
          <SidenavItem
            key={i}
            item={item}
            selected={item.segment === segment}
          />
        ))}
      </List>
      <Box py={2}>
        <Divider />
      </Box>
      <List component="nav">
        {external.map((item, i) => (
          <SidenavItem key={i} item={item} external />
        ))}
      </List>
    </Box>
  );
}
