import Router, { useRouter } from "next/router";
import { useEffect } from "react";

import * as RA from "fp-ts/lib/ReadOnlyArray";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import i18nextConfig from "../../next-i18next.config";

const { locales, defaultLocale } = i18nextConfig.i18n;

/* Although nextJs supports automatic redirection, it is necessary to configure it manually
 * as i18 is not compatible with the export of static sites.
 * https://github.com/vercel/next.js/issues/18318
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const defaultBrowserLanguage = pipe(
      locales,
      RA.findFirst((locale) =>
        pipe(
          navigator.languages,
          RA.findFirst((navigatorLang) => navigatorLang.startsWith(locale)),
          O.isSome
        )
      ),
      O.getOrElse(() => defaultLocale)
    );
    void Router.push("/" + defaultBrowserLanguage);
  }, [router]);
}
