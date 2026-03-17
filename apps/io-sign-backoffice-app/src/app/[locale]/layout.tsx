import { useLocale, useMessages } from "next-intl";
import { notFound } from "next/navigation";

import IntlClientProvider from "@/i18n/IntlClientProvider";

import { MSWProvider } from "@/components/MSWProvider";
import ThemeRegistry from "@/components/ThemeRegistry";
import { pick } from "lodash";

if (
  process.env.NEXT_PUBLIC_MOCK_MSW_ENABLED === "true" &&
  typeof window === "undefined" &&
  process.env.NODE_ENV === "development"
) {
  /**
   * Use dynamic require to prevent MSW from being bundled in the client-side 
   * and to avoid side-effects during the Next.js build process. 
   * This ensures MSW only patches Node.js primitives at runtime when 
   * server-side mocking is explicitly required.
   */
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { startMSWServer } = require("../../../mocks/msw-node");
  startMSWServer();
}

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
        <MSWProvider>
          <IntlClientProvider intl={{ locale, messages: clientMessages }}>
            <ThemeRegistry options={{ key: "mui" }}>{children}</ThemeRegistry>
          </IntlClientProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
