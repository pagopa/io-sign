import { useLocale, useTranslations } from "next-intl";

import { notFound, redirect } from "next/navigation";

import ThemeRegistry from "@/components/mui/ThemeRegistry";
import { Stack } from "@/components/mui";

import HeaderWithAccountInfo from "./_components/HeaderWithAccountInfo";
import Footer from "./_components/Footer";

import { getLoggedUser, User } from "@/app/auth/_lib/user";

import { getConfig } from "@/config";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const config = getConfig();
  const locale = useLocale();
  if (params.locale !== locale) {
    notFound();
  }
  let loggedUser: User;
  try {
    loggedUser = await getLoggedUser();
  } catch (e) {
    redirect(config.selfCare.portal.url.href);
  }
  return (
    <RootLayoutContent locale={locale} loggedUser={loggedUser}>
      {children}
    </RootLayoutContent>
  );
}

function RootLayoutContent({
  loggedUser,
  locale,
  children,
}: {
  loggedUser: User;
  locale: string;
  children: React.ReactNode;
}) {
  const config = getConfig();
  const t = useTranslations();
  const companyLink = {
    href: "https://pagopa.it",
    ariaLabel: t("common.companyLink.ariaLabel"),
    title: t("common.companyLink.title"),
    label: "PagoPA S.p.A.",
  };
  return (
    <html lang={locale}>
      <body>
        <ThemeRegistry>
          <Stack sx={{ minHeight: "100vh" }}>
            <HeaderWithAccountInfo
              companyLink={companyLink}
              loggedUser={loggedUser}
              documentationUrl={config.documentationUrl.href}
              supportUrl={config.selfCare.portal.supportUrl.href}
            />
            <Stack sx={{ flexGrow: 1 }}>{children}</Stack>
            <Footer
              companyLink={companyLink}
              legalContent={t.rich("Footer.legal")}
            />
          </Stack>
        </ThemeRegistry>
      </body>
    </html>
  );
}
