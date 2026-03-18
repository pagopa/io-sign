import { Suspense } from "react";

import { getTranslations } from "next-intl/server";

import { listApiKeys } from "@/lib/api-keys/use-cases";

import Page from "@/components/Page";

import ApiKeyListView from "./_components/ApiKeyListView";
import ApiKeyEmptyListView from "./_components/ApiKeyEmptyListView";

export default async function ApiKeys({
  params,
}: {
  params: Promise<{ institution: string }>;
}) {
  const { institution } = await params;
  const t = await getTranslations("firmaconio.apiKeys");
  const props = {
    title: t("title"),
    description: t("description"),
  };
  const apiKeys = listApiKeys(institution);
  return (
    <Page header={props}>
      <Suspense fallback={<ApiKeyEmptyListView loading />}>
        <ApiKeyListView apiKeys={apiKeys} />
      </Suspense>
    </Page>
  );
}
