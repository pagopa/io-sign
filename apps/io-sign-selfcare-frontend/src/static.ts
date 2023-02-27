import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import i18nextConfig from "../next-i18next.config";

export const getI18nPaths = () =>
  i18nextConfig.i18n.locales.map((lng) => ({
    params: {
      locale: lng,
    },
  }));

export const getStaticPaths = () => ({
  fallback: false,
  paths: getI18nPaths(),
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
