import React from "react";
import { Stack } from "@mui/material";

import { useTranslations } from "next-intl";

import ThemeRegistry from "@/components/ThemeRegistry";

import Header from "@/components/Header";
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
      <Stack sx={{ height: "100vh" }}>
        <Header institutionId={params.institution} rootLink={rootLink} />
        {children}
        <Footer rootLink={rootLink} />
      </Stack>
    </ThemeRegistry>
  );
}
