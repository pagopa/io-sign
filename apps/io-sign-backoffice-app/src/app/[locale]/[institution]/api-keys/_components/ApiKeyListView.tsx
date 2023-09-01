"use client";

import { useMemo, useState, Usable, use } from "react";
import { useTranslations } from "next-intl";

import { Stack, Tabs, Tab, Alert } from "@mui/material";

import { ApiKey } from "@/lib/api-keys";

import ApiKeyListHeader from "./ApiKeyListHeader";
import ApiKeyTable from "./ApiKeyTable";
import ApiKeyEmptyTable from "./ApiKeyEmptyTable";
import ApiKeyEmptyListView from "./ApiKeyEmptyListView";

type Props = {
  apiKeys: Usable<ApiKey[]>;
};

export default function ApiKeyListView(props: Props) {
  const apiKeys = use(props.apiKeys);
  const t = useTranslations("firmaconio");
  const [environment, setEnvironment] = useState<ApiKey["environment"]>("prod");

  const apiKeysForEnvironment = useMemo(
    () => apiKeys.filter((apiKey) => apiKey.environment === environment),
    [apiKeys, environment]
  );

  if (apiKeys.length === 0) {
    return <ApiKeyEmptyListView />;
  }

  const onChange = (e: unknown, env: ApiKey["environment"]) => {
    setEnvironment(env);
  };

  const isProd = environment === "prod";

  return (
    <Stack spacing={5}>
      <Tabs value={environment} variant="fullWidth" onChange={onChange}>
        <Tab label={t("apiKey.environments.prod")} value="prod" />
        <Tab label={t("apiKey.environments.test")} value="test" />
      </Tabs>
      {isProd && (
        <Alert severity="warning" variant="outlined">
          {t.rich("createApiKey.alert")}
        </Alert>
      )}
      <ApiKeyListHeader showAction={!isProd} />
      {apiKeysForEnvironment.length > 0 ? (
        <ApiKeyTable apiKeys={apiKeysForEnvironment} />
      ) : (
        <ApiKeyEmptyTable showAction={!isProd} />
      )}
    </Stack>
  );
}
