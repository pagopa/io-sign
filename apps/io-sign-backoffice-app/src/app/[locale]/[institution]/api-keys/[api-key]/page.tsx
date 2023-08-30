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

import { ApiKeyWithSecret } from "@/lib/api-keys";

import { pick } from "lodash";

export default function ApiKeyDetailPage({
  params,
}: {
  params: { institution: string; ["api-key"]: string };
}) {
  const t = useTranslations("firmaconio");

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

  const displayName = params["api-key"];

  const apiKey: ApiKeyWithSecret = {
    displayName,
    institutionId: params.institution,
    environment: "prod",
    status: "active",
    cidrs: ["10.10.10.10/24"],
    testers: ["CVLLCU95L14C351Q"],
    createdAt: new Date(),
    secret: "ciao",
    id: "ciao",
  };

  const apiKeysHref = `/${params.institution}/api-keys`;

  const headerProps: PageHeaderProps = {
    title: displayName,
    navigation: {
      hierarchy: [
        { icon: VpnKey, label: t("apiKeys.title"), href: apiKeysHref },
        { label: displayName },
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
        {apiKey.environment === "test" && (
          <TestersSettings
            fiscalCodes={apiKey.testers}
            disabled={apiKey.status === "revoked"}
          />
        )}
      </NextIntlClientProvider>
    </Stack>
  );
}
