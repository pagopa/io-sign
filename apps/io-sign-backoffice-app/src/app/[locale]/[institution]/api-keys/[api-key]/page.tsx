import { Suspense, use } from "react";

import { useTranslations } from "next-intl";

import { PeopleAlt, PinDrop, VpnKey } from "@mui/icons-material";

import { getApiKeyWithSecret } from "@/lib/api-keys/use-cases";

import Page, { Props as PageProps } from "@/components/Page";

import ApiKeyEditableFieldCard from "./_components/ApiKeyEditableFieldCard";
import ApiKeyProvider from "./_components/ApiKeyProvider";
import ApiKeySummary from "./_components/ApiKeySummary";
import ApiKeyCreatedSnackbar from "./_components/ApiKeyCreatedSnackbar";
import { Alert } from "@mui/material";

export default function ApiKeyDetailPage({
  params,
}: {
  params: { institution: string; ["api-key"]: string };
}) {
  const t = useTranslations("firmaconio");
  const apiKey = use(
    getApiKeyWithSecret(params["api-key"], params["institution"])
  );
  const apiKeysHref = `/${params.institution}/api-keys`;
  const header: PageProps["header"] = {
    title: apiKey.displayName,
    navigation: {
      hierarchy: [
        { icon: VpnKey, label: t("apiKeys.title"), href: apiKeysHref },
        { label: apiKey.displayName },
      ],
      startButton: { label: "Indietro", href: apiKeysHref },
    },
  };

  const showInfoAlert =
    apiKey.cidrs.length === 0 && apiKey.testers.length === 0;

  return (
    <Page header={header}>
      {showInfoAlert && (
        <Alert variant="outlined" severity="info">
          {t("apiKey.alerts.empty")}
        </Alert>
      )}
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
      <ApiKeyCreatedSnackbar />
    </Page>
  );
}
