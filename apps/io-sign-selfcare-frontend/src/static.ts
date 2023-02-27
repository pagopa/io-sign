import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import i18nextConfig from "../next-i18next.config";

// Return a path array for each supported language
const createI18PathArray = (supportedLanguages: string[]) =>
  supportedLanguages.map((lng) => ({
    params: {
      locale: lng,
    },
  }));

//  Indicate which paths should be created on build time (returning a paths array) without fallback.
export const getStaticPaths = () => ({
  fallback: false,
  paths: createI18PathArray(i18nextConfig.i18n.locales),
});

export async function getI18nProps(locale: string, ns: string[]) {
  let props = {
    ...(await serverSideTranslations(locale, ns)),
  };
  return props;
}

export function makeStaticProps(ns = ["common"]) {
  return async function getStaticProps(locale: { params: { locale: string } }) {
    return {
      props: await getI18nProps(locale.params.locale, ns),
    };
  };
}
