import { use, Suspense } from "react";

import { useTranslations } from "next-intl";

import { Alert, Stack } from "@mui/material";
import { SvgIconComponent, VpnKey } from "@mui/icons-material";

import { getInstitution } from "@/lib/institutions/use-cases";

import PageHeader, { Props as PageHeaderProps } from "@/components/PageHeader";

import CreateApiKeyForm from "./_components/CreateApiKeyForm";
import ApiKeyMetadataCard from "./_components/ApiKeyMetadataCard";
import ApiKeyEditableFieldCard from "./_components/ApiKeyEditableFieldCard";

function CreateApiKeyPageHeader({
  parent,
}: {
  parent: { label: string; href: string; icon: SvgIconComponent };
}) {
  const t = useTranslations("firmaconio.createApiKey");
  const props: PageHeaderProps = {
    title: t("title"),
    description: t("description"),
    navigation: {
      hierarchy: [parent, { label: t("title") }],
      startButton: { label: "Esci", href: parent.href },
    },
  };
  return <PageHeader {...props} />;
}

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

  const institution = use(getInstitution(params.institution));

  return (
    <Stack spacing={5} sx={{ maxWidth: "calc(100% - 300px)" }}>
      <Suspense>
        <CreateApiKeyPageHeader parent={parent} />
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
    </Stack>
  );
}
