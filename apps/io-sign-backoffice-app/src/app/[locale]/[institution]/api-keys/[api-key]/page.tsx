import PageHeader, { Props as PageHeaderProps } from "@/components/PageHeader";
import { VpnKey } from "@mui/icons-material";
import { Stack } from "@mui/material";

import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  useTranslations,
} from "next-intl";

import ApiKeySummary from "./_components/ApiKeySummary";
import NetworkSettings from "./_components/NetworkSettings";
import TestersSettings from "./_components/TestersSettings";

import { ApiKeyWithSecret, getApiKeyWithSecret } from "@/lib/api-keys";

import { pick } from "lodash";
import { use } from "react";

export default function ApiKeyDetailPage({
  params,
}: {
  params: { institution: string; ["api-key"]: string };
}) {
  const t = useTranslations("firmaconio");

  let apiKey: ApiKeyWithSecret = use(
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
        <ApiKeySummary apiKey={apiKey} />
        <NetworkSettings
          cidrs={apiKey.cidrs}
          disabled={apiKey.status === "revoked"}
        />
        {apiKey.environment === "test" && <TestersSettings apiKey={apiKey} />}
      </NextIntlClientProvider>
    </Stack>
  );
}
