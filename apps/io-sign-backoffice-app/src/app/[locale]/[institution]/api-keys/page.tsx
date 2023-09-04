import { Suspense } from "react";

import { useTranslations } from "next-intl";

import { Stack } from "@mui/material";
import PageHeader, { Props as PageHeaderProps } from "@/components/PageHeader";

import { listApiKeys } from "@/lib/api-keys/use-cases";

import ApiKeyListView from "./_components/ApiKeyListView";
import ApiKeyEmptyListView from "./_components/ApiKeyEmptyListView";

function ApiKeysPageHeader() {
  const t = useTranslations("firmaconio.apiKeys");
  const props: PageHeaderProps = {
    title: t("title"),
    description: t("description"),
  };
  return <PageHeader {...props} />;
}

export default function ApiKeys({
  params,
}: {
  params: { institution: string };
}) {
  const apiKeys = listApiKeys(params.institution);
  return (
    <Stack spacing={5}>
      <ApiKeysPageHeader />
      <Suspense fallback={<ApiKeyEmptyListView loading />}>
        <ApiKeyListView apiKeys={apiKeys} />
      </Suspense>
    </Stack>
  );
}
