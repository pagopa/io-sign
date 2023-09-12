"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Stack } from "@mui/material";

import { User } from "@/lib/auth";
import { Institution, Product } from "@/lib/institutions";

import { HeaderAccount, HeaderProduct, RootLinkType } from "@pagopa/mui-italia";

export type Props = {
  products: Product[];
  institutions: Institution[];
  institutionId: string;
  loggedUser: User;
};

export default function ClientHeader({
  loggedUser,
  products,
  institutions,
  institutionId,
}: Props) {
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

  const onSelectedParty = useCallback(
    (party: { id: string }) => {
      router.push(`/${party.id}`);
    },
    [router]
  );

  const onSelectedProduct = useCallback(
    (product: { id: string }) => {
      const url = new URL(
        `token-exchange?institutionId=${institutionId}&productId=${product.id}`,
        selfcareURL
      );
      router.push(url.href);
    },
    [institutionId, router, selfcareURL]
  );

  return (
    <Stack>
      <HeaderAccount
        rootLink={rootLink}
        loggedUser={loggedUser}
        onAssistanceClick={onAssistanceClick}
        onDocumentationClick={onDocumentationClick}
        onLogout={onLogout}
      />
      <HeaderProduct
        productsList={products}
        productId="prod-io-sign"
        partyList={institutions}
        partyId={institutionId}
        onSelectedParty={onSelectedParty}
        onSelectedProduct={onSelectedProduct}
      />
    </Stack>
  );
}
