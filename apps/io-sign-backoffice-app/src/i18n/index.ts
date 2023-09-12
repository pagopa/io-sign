import { getRequestConfig } from "next-intl/server";

import { defaultTranslationValues } from "./options";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
  defaultTranslationValues,
}));
