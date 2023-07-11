"use client";

import { useTranslations } from "next-intl";

import { HeaderAccount } from "@pagopa/mui-italia";

export default function HeaderWithAccountInfo() {
  const t = useTranslations("HeaderWithAccountInfo");
  const rootLink = {
    label: "PagoPA S.p.A",
    href: "https://www.pagopa.it/",
    title: t("rootLink.title"),
    ariaLabel: t("rootLink.ariaLabel"),
  };
  return <HeaderAccount rootLink={rootLink} onAssistanceClick={() => {}} />;
}
