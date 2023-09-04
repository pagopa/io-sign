"use client";

import { useTranslations } from "next-intl";

import { Stack } from "@mui/material";

import { FooterPostLogin, FooterLegal } from "@pagopa/mui-italia";

type Props = {
  rootLink: {
    href: string;
    ariaLabel: string;
  };
};

export default function Footer({ rootLink }: Props) {
  const t = useTranslations("firmaconio.footer");
  return (
    <Stack>
      <FooterPostLogin
        currentLangCode="it"
        languages={{ it: { it: "Italiano" } }}
        onLanguageChanged={() => {}}
        companyLink={rootLink}
        links={[]}
      />
      <FooterLegal
        content={<span style={{ whiteSpace: "pre-line" }}>{t("legal")}</span>}
      />
    </Stack>
  );
}
