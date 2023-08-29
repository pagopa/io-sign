import { useLocale } from "next-intl";
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
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
