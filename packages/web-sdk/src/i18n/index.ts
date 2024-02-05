import { configureLocalization } from "@lit/localize";

import { sourceLocale, targetLocales } from "./locales";
import * as templates_it from "./locales/it";

const localizedTemplates = new Map([["it", templates_it]]);

export const { setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: async (locale) => {
    const templates = localizedTemplates.get(locale);
    if (typeof templates === "undefined") {
      throw new Error(`Unable to local ${locale} locale: templates not found.`);
    }
    return templates;
  },
});

export const setLocaleFromUserSettings = async (): Promise<void> => {
  const [locale] = navigator.language.split("-");
  try {
    setLocale(locale);
  } catch (e) {
    console.warn(
      `Missing locale data for: "${navigator.language}". Using default locale: "${sourceLocale}" as fallback.`,
    );
  }
};
