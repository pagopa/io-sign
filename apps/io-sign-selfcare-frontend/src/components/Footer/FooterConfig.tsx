import { CompanyLinkType } from "@pagopa/mui-italia";
import { CONFIG } from "@/config";

export type LangCode = "it" | "en";

export const pagoPALink: CompanyLinkType = {
  href: CONFIG.FOOTER.LINK.PAGOPALINK,
  ariaLabel: "Link: vai al sito di PagoPA S.p.A.",
};

export const LANGUAGES = {
  it: { it: "Italiano" },
};
