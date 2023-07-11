import { NextIntlClientProvider } from "next-intl";

import { notFound } from "next/navigation";

import ThemeRegistry from "@/components/mui/ThemeRegistry";
import HeaderWithAccountInfo from "./_components/HeaderWithAccountInfo";

export function generateStaticParams() {
  return [{ locale: "it" }];
}

export default async function RootLayoutWithLocaleAndTheme({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeRegistry>
            <HeaderWithAccountInfo />
            {children}
          </ThemeRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
