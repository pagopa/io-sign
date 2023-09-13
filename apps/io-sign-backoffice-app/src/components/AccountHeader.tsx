"use client";

import { User } from "@/lib/auth";
import { RootLinkType } from "@pagopa/mui-italia";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useCallback } from "react";

import { HeaderAccount } from "@pagopa/mui-italia";

export type Props = {
  loggedUser: User;
};

export default function AccountHeader({ loggedUser }: Props) {
  const router = useRouter();

  const t = useTranslations("firmaconio");

  const rootLink = useMemo((): RootLinkType => {
    const label = "PagoPA S.p.A";
    return {
      href: process.env.NEXT_PUBLIC_COMPANY_LINK ?? "https://pagopa.it",
      label,
      title: t("a11y.link.title", { label }),
      ariaLabel: t("a11y.link.ariaLabel", { label }),
    };
  }, [t]);

  const selfcareURL =
    process.env.NEXT_PUBLIC_SELFCARE_URL ?? "https://selfcare.pagopa.it";

  const onAssistanceClick = useCallback(() => {
    const url = new URL("assistenza", selfcareURL);
    window.location.href = url.href;
  }, [selfcareURL]);

  const onDocumentationClick = useCallback(() => {
    window.open(
      process.env.NEXT_PUBLIC_DOCUMENTATION_URL,
      "_blank",
      "noreferrer"
    );
  }, []);

  const onLogout = useCallback(() => {
    router.push("/auth/logout");
  }, [router]);

  return (
    <HeaderAccount
      rootLink={rootLink}
      loggedUser={loggedUser}
      onAssistanceClick={onAssistanceClick}
      onDocumentationClick={onDocumentationClick}
      onLogout={onLogout}
    />
  );
}
