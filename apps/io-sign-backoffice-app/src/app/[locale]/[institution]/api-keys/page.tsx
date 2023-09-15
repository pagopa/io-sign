import { Suspense } from "react";

import { useTranslations } from "next-intl";

import { listApiKeys } from "@/lib/api-keys/use-cases";

import Page from "@/components/Page";

import ApiKeyListView from "./_components/ApiKeyListView";
import ApiKeyEmptyListView from "./_components/ApiKeyEmptyListView";

export default function ApiKeys({
  params,
}: {
  params: { institution: string };
}) {
  const t = useTranslations("firmaconio.apiKeys");
  const props = {
    title: t("title"),
    description: t("description"),
  };
  const apiKeys = listApiKeys(params.institution);
  return (
    <Page header={props}>
      <Suspense fallback={<ApiKeyEmptyListView loading />}>
        <ApiKeyListView apiKeys={apiKeys} />
      </Suspense>
    </Page>
  );
}
