"use client";

import { HeaderAccount } from "@pagopa/mui-italia";

const rootLink = {
  label: "PagoPA S.p.A",
  href: "https://www.pagopa.it/",
  ariaLabel: "Link: vai al sito di PagoPA S.p.A.",
  title: "Sito di PagoPA S.p.A.",
};

export default function MainHeader() {
  return (
    <HeaderAccount
      rootLink={rootLink}
      onAssistanceClick={() => {}}
      enableLogin={false}
    />
  );
}
