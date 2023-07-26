"use client";

import { FooterPostLogin, FooterLegal } from "@pagopa/mui-italia";

type Props = {
  legalContent: React.ReactNode;
  companyLink: {
    href: string;
    ariaLabel: string;
  };
};

export default function Footer({ legalContent, companyLink }: Props) {
  return (
    <>
      <FooterPostLogin
        currentLangCode="it"
        languages={{ it: { it: "Italiano" } }}
        onLanguageChanged={() => {}}
        companyLink={companyLink}
        links={[]}
      />
      <FooterLegal
        content={<span style={{ whiteSpace: "pre-line" }}>{legalContent}</span>}
      />
    </>
  );
}
