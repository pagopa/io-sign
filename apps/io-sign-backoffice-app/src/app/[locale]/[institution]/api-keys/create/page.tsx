import PageHeader, { Props as PageHeaderProps } from "@/components/PageHeader";
import { getConfig } from "@/config";
import { SvgIconComponent, VpnKey } from "@mui/icons-material";
import { Alert, Stack, Button } from "@mui/material";

import { use } from "react";

import {
  useTranslations,
  NextIntlClientProvider,
  useLocale,
  useMessages,
} from "next-intl";

import { pick } from "lodash";

import CreateApiKeyForm from "./_components/CreateApiKeyForm";
import ApiKeyDetailSection from "./_components/ApiKeyDetailSection";
import ApiKeyNetworkSection from "./_components/ApiKeyNetworkSection";

import NextLink from "next/link";
import { Suspense } from "react";
import { Institution, getInstitution } from "@/lib/selfcare/api";

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

function LocalizedCreateApiKeyForm({
  children,
  institution,
}: {
  children: React.ReactNode;
  institution: Institution;
}) {
  const locale = useLocale();
  const messages = useMessages();

  if (!messages) {
    throw new Error("unable to fetch localized messages");
  }

  const createApiKeyFormMessages = pick(
    messages,
    "firmaconio.createApiKey.form"
  );

  return (
    <NextIntlClientProvider locale={locale} messages={createApiKeyFormMessages}>
      <CreateApiKeyForm institution={institution}>{children}</CreateApiKeyForm>
    </NextIntlClientProvider>
  );
}

export default function CreateApiKeyPage({
  params,
}: {
  params: { institution: string };
}) {
  const t = useTranslations("firmaconio");
  const { documentationUrl } = getConfig();

  const parent = {
    icon: VpnKey,
    label: t("apiKeys.title"),
    href: `/${params.institution}/api-keys`,
  };

  const institution = use(getInstitution(params.institution));

  console.log(institution);

  return (
    <Stack spacing={5} sx={{ maxWidth: "calc(100% - 300px)" }}>
      <Suspense fallback={<span>loading...</span>}>
        <CreateApiKeyPageHeader parent={parent} />
        <Alert
          severity="warning"
          variant="outlined"
          children={t.rich("createApiKey.alert")}
        />
        <LocalizedCreateApiKeyForm institution={institution}>
          <Stack spacing={5}>
            <ApiKeyDetailSection documentationUrl={documentationUrl} />
            <ApiKeyNetworkSection />
            <Stack direction="row" justifyContent="space-between">
              <Button
                variant="outlined"
                href={parent.href}
                LinkComponent={NextLink}
              >
                Indietro
              </Button>
              <Button type="submit" variant="contained">
                Continua
              </Button>
            </Stack>
          </Stack>
        </LocalizedCreateApiKeyForm>
      </Suspense>
    </Stack>
  );
}
