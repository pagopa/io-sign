import {
  Footer as MuiItaliaFooter,
  FooterLinksType,
  PreLoginFooterLinksType,
} from "@pagopa/mui-italia/dist/components/Footer/Footer";
import { Trans, useTranslation } from "next-i18next";

import { LANGUAGES, pagoPALink } from "./FooterConfig";
import { CONFIG } from "@/config";

type FooterProps = {
  loggedUser: boolean;
  productsJsonUrl?: string;
  onExit?: (exitAction: () => void) => void;
};

export default function Footer({
  loggedUser,
  productsJsonUrl,
  onExit = (exitAction) => exitAction(),
}: FooterProps) {
  const { t, i18n } = useTranslation();

  // These links are empty because we will only use the postLogin part for now
  const preLoginLinks: PreLoginFooterLinksType = {
    aboutUs: {
      title: undefined,
      links: [],
    },
    resources: {
      title: undefined,
      links: [],
    },
    followUs: {
      title: "",
      socialLinks: [],
      links: [],
    },
  };
  const postLoginLinks: FooterLinksType[] = [
    {
      label: t("common.footer.postLoginLinks.privacyPolicy"),
      href: CONFIG.FOOTER.LINK.PRIVACYPOLICY,
      ariaLabel: "Vai al link: Privacy policy",
      linkType: "internal",
    },
    {
      label: t("common.footer.postLoginLinks.protectionOfPersonalData"),
      href: CONFIG.FOOTER.LINK.protectionOfPersonalData,
      ariaLabel: "Vai al link: Diritto alla protezione dei dati personali",
      linkType: "internal",
    },
    {
      label: t("common.footer.postLoginLinks.termsAndConditions"),
      href: CONFIG.FOOTER.LINK.TERMSANDCONDITIONS,
      ariaLabel: "Vai al link: Termini e condizioni",
      linkType: "internal",
    },
  ];

  const companyLegalInfo = (
    <Trans i18nKey="common.footer.legalInfoText"></Trans>
  );

  return (
    <MuiItaliaFooter
      companyLink={pagoPALink}
      postLoginLinks={postLoginLinks}
      preLoginLinks={preLoginLinks}
      legalInfo={companyLegalInfo}
      loggedUser={loggedUser}
      onExit={onExit}
      languages={LANGUAGES}
      onLanguageChanged={(language: string) => i18n?.changeLanguage(language)}
      currentLangCode="it"
      productsJsonUrl={productsJsonUrl}
    />
  );
}
