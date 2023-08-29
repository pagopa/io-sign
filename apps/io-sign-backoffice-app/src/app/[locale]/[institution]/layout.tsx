import React from "react";
import { Stack, Box } from "@mui/material";

import { useTranslations } from "next-intl";

import ThemeRegistry from "@/components/ThemeRegistry";
import InstitutionContext from "@/context/institution";

import Preview from "@/components/Preview";

import Header from "@/components/Header";
import Sidenav from "@/components/Sidenav";
import Footer from "@/components/Footer";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { institution: string };
}) {
  const t = useTranslations();
  const rootLink = {
    href: "https://pagopa.it",
    ariaLabel: t("common.companyLink.ariaLabel"),
    title: t("common.companyLink.title"),
    label: "PagoPA S.p.A.",
  };
  return (
    <ThemeRegistry options={{ key: "mui" }}>
      <InstitutionContext.Provider value={params.institution}>
        <Stack sx={{ height: "100vh" }}>
          <Header rootLink={rootLink} />
          <Stack direction="row" flexGrow={1}>
            <Preview>
              <Sidenav />
            </Preview>
            <Box p={3} flexGrow={1} children={children} />
          </Stack>
          <Footer rootLink={rootLink} />
        </Stack>
      </InstitutionContext.Provider>
    </ThemeRegistry>
  );
}
