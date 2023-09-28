"use client";

import { useTranslations } from "next-intl";

import { Stack } from "@mui/material";

import { FooterPostLogin, FooterLegal } from "@pagopa/mui-italia";

export default function Footer() {
  const t = useTranslations("firmaconio");

  const languages = {
    it: { it: "Italiano" },
  };

  const companyLink = {
    href: process.env.NEXT_PUBLIC_COMPANY_LINK,
    ariaLabel: t("a11y.link.ariaLabel", { label: "PagoPA S.p.A." }),
  };

  return (
    <Stack>
      <FooterPostLogin
        languages={languages}
        onLanguageChanged={() => {}}
        companyLink={companyLink}
        links={[
          {
            label: "Informativa privacy",
            href: "/privacy-policy",
            ariaLabel: t("a11y.link.ariaLabel", {
              label: "Informativa Privacy",
            }),
            linkType: "internal",
          },
          {
            label: "Termini e condizioni d'uso",
            href: "/terms-of-service",
            ariaLabel: t("a11y.link.ariaLabel", {
              label: "Termini e condizioni d'uso",
            }),
            linkType: "internal",
          },
        ]}
      />
      <FooterLegal
        content={
          <span style={{ whiteSpace: "pre-line" }}>
            {t.rich("footer.legal")}
          </span>
        }
      />
    </Stack>
  );
}
