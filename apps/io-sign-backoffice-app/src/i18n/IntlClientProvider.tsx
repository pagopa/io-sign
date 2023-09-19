"use client";

import { NextIntlClientProvider, IntlConfig } from "next-intl";
import { defaultTranslationValues } from "./options";

export type Props = {
  intl: IntlConfig;
  children: React.ReactNode;
};

export default function IntlClientProvider({
  intl: { now, locale, messages },
  children,
}: Props) {
  return (
    <NextIntlClientProvider
      now={now}
      locale={locale}
      messages={messages}
      defaultTranslationValues={defaultTranslationValues}
    >
      {children}
    </NextIntlClientProvider>
  );
}
