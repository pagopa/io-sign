import { getRequestConfig } from "next-intl/server";

import { defaultTranslationValues } from "./options";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    defaultTranslationValues,
  };
});
