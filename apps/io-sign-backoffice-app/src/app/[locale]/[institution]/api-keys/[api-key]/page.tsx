import PageHeader, { Props as PageHeaderProps } from "@/components/PageHeader";
import { PeopleAlt, PinDrop, VpnKey } from "@mui/icons-material";
import { Stack } from "@mui/material";

import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  useTranslations,
} from "next-intl";

import ApiKeySummary from "./_components/ApiKeySummary";
import ApiKeyEditableFieldCard from "./_components/ApiKeyEditableFieldCard";

import ApiKeyProvider from "./_components/ApiKeyProvider";

import { getApiKeyWithSecret } from "@/lib/api-keys/use-cases";

import { pick } from "lodash";
import { Suspense, use } from "react";

export default function ApiKeyDetailPage({
  params,
}: {
  params: { institution: string; ["api-key"]: string };
}) {
  const t = useTranslations("firmaconio");

  const apiKey = use(
    getApiKeyWithSecret(params["api-key"], params["institution"])
  );

  const locale = useLocale();
  const messages = useMessages();

  if (!messages) {
    throw new Error("unable to fetch localized messages");
  }

  const clientMessages = pick(messages, [
    "firmaconio.modals",
    "firmaconio.apiKey.secret",
    "firmaconio.apiKey.network",
    "firmaconio.apiKey.testers",
  ]);

  const apiKeysHref = `/${params.institution}/api-keys`;

  const headerProps: PageHeaderProps = {
    title: apiKey.displayName,
    navigation: {
      hierarchy: [
        { icon: VpnKey, label: t("apiKeys.title"), href: apiKeysHref },
        { label: apiKey.displayName },
      ],
      startButton: { label: "Indietro", href: apiKeysHref },
    },
  };

  return (
    <Stack spacing={5}>
      <PageHeader {...headerProps} />
      <NextIntlClientProvider locale={locale} messages={clientMessages}>
        <ApiKeyProvider value={apiKey}>
          <Suspense>
            <ApiKeySummary apiKey={apiKey} />
            <ApiKeyEditableFieldCard
              field="cidrs"
              i18n={{ namespace: "firmaconio.apiKey.network" }}
              icon={PinDrop}
            />
            {apiKey.environment === "test" && (
              <ApiKeyEditableFieldCard
                field="testers"
                i18n={{ namespace: "firmaconio.apiKey.testers" }}
                icon={PeopleAlt}
              />
            )}
          </Suspense>
        </ApiKeyProvider>
      </NextIntlClientProvider>
    </Stack>
  );
}
