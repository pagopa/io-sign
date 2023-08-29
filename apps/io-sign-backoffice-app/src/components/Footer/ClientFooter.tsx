"use client";

import { FooterPostLogin, FooterLegal } from "@pagopa/mui-italia";
import { Stack } from "@mui/system";

type Props = {
  legalContent: React.ReactNode;
  rootLink: {
    href: string;
    ariaLabel: string;
  };
};

export default function Footer({ legalContent, rootLink }: Props) {
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
        content={<span style={{ whiteSpace: "pre-line" }}>{legalContent}</span>}
      />
    </Stack>
  );
}
