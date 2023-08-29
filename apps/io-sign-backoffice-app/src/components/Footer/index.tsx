import { useTranslations } from "next-intl";

import { RootLinkType } from "@pagopa/mui-italia";

import ClientFooter from "./ClientFooter";

export default function Footer({ rootLink }: { rootLink: RootLinkType }) {
  const t = useTranslations();
  return (
    <ClientFooter rootLink={rootLink} legalContent={t.rich("Footer.legal")} />
  );
}
