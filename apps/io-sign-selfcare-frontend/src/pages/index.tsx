import Router, { useRouter } from "next/router";
import { useEffect } from "react";
import i18nextConfig from "../../next-i18next.config";

const { locales, defaultLocale } = i18nextConfig.i18n;

/* Although nextJs supports automatic redirection, it is necessary to configure it manually
 * as i18 is not compatible with the export of static sites.
 * https://github.com/vercel/next.js/issues/18318
 */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    for (const locale of locales) {
      for (const lang of navigator.languages) {
        if (lang.startsWith(locale)) {
          Router.push("/" + locale);
          return;
        }
      }
    }
    Router.push("/" + defaultLocale);
    return;
  }, [router]);
}
