import { getLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import IntlClientProvider from "@/i18n/IntlClientProvider";

import { MSWProvider } from "@/components/MSWProvider";
import ThemeRegistry from "@/components/ThemeRegistry";
import { pick } from "lodash";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const serverLocale = await getLocale();
  if (locale !== serverLocale) {
    notFound();
  }
  const messages = await getMessages();
  if (!messages) {
    notFound();
  }
  const clientMessages = pick(messages, [
    "firmaconio.a11y",
    "firmaconio.modals",
    "firmaconio.footer",
    "firmaconio.tos",
    "firmaconio.overview.cards.issuer.supportEmail",
    "firmaconio.apiKeys.list",
    "firmaconio.apiKeys.alert",
    "firmaconio.apiKeys.table",
    "firmaconio.createApiKey",
    "firmaconio.apiKey",
    "firmaconio.overview.title",
    "firmaconio.apiKeys.title",
  ]);
  return (
    <html lang={locale}>
      <body>
        <MSWProvider>
          <IntlClientProvider intl={{ locale, messages: clientMessages }}>
            <ThemeRegistry options={{ key: "mui" }}>{children}</ThemeRegistry>
          </IntlClientProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
