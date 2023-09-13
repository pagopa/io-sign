import { notFound } from "next/navigation";
import { useLocale, useMessages } from "next-intl";

import IntlClientProvider from "@/i18n/IntlClientProvider";

import { pick } from "lodash";
import ThemeRegistry from "@/components/ThemeRegistry";

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = useLocale();
  if (params.locale !== locale) {
    notFound();
  }
  const messages = useMessages();
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
        <IntlClientProvider intl={{ locale, messages: clientMessages }}>
          <ThemeRegistry options={{ key: "mui" }}>{children}</ThemeRegistry>
        </IntlClientProvider>
      </body>
    </html>
  );
}
