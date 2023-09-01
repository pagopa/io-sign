import { Link } from "@mui/material";
import { pick } from "lodash";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { notFound } from "next/navigation";

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
    "firmaconio.modals",
    "firmaconio.footer",
    "firmaconio.apiKeys.list",
    "firmaconio.apiKeys.alert",
    "firmaconio.apiKeys.table",
    "firmaconio.createApiKey",
    "firmaconio.apiKey",
  ]);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
