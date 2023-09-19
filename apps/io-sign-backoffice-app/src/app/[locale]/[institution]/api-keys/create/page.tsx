import { use, Suspense } from "react";

import { useTranslations } from "next-intl";

import { Alert } from "@mui/material";
import { VpnKey } from "@mui/icons-material";

import { getInstitution } from "@/lib/institutions/use-cases";

import Page, { Props as PageProps } from "@/components/Page";

import CreateApiKeyForm from "./_components/CreateApiKeyForm";
import ApiKeyMetadataCard from "./_components/ApiKeyMetadataCard";
import ApiKeyEditableFieldCard from "./_components/ApiKeyEditableFieldCard";
import { notFound } from "next/navigation";

export default function CreateApiKeyPage({
  params,
}: {
  params: { institution: string };
}) {
  const t = useTranslations("firmaconio");
  const parent = {
    icon: VpnKey,
    label: t("apiKeys.title"),
    href: `/${params.institution}/api-keys`,
  };
  const header: PageProps["header"] = {
    title: t("createApiKey.title"),
    description: t("createApiKey.description"),
    navigation: {
      hierarchy: [parent, { label: t("createApiKey.title") }],
      startButton: { label: "Esci", href: parent.href },
    },
  };
  const institution = use(getInstitution(params.institution));
  if (!institution) {
    notFound();
  }
  return (
    <Page header={header} hideSidenav>
      <Suspense>
        <Alert severity="warning" variant="outlined">
          {t.rich("createApiKey.alert")}
        </Alert>
        <CreateApiKeyForm institution={institution}>
          <ApiKeyMetadataCard />
          <ApiKeyEditableFieldCard
            field="cidrs"
            i18n={{ namespace: "firmaconio.createApiKey.form.network" }}
          />
          <ApiKeyEditableFieldCard
            field="testers"
            i18n={{ namespace: "firmaconio.createApiKey.form.testers" }}
          />
        </CreateApiKeyForm>
      </Suspense>
    </Page>
  );
}
