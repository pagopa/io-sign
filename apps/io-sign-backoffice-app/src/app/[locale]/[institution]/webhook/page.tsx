import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import Page from "@/components/Page";

import { getWebhookForInstitution } from "@/lib/webhooks/use-cases";

import WebhookView from "./_components/WebhookView";
import WebhookEmptyView from "./_components/WebhookEmptyView";

export default async function WebhookPage({
  params,
}: {
  params: Promise<{ institution: string }>;
}) {
  const { institution } = await params;
  const t = await getTranslations("firmaconio.webhook");

  const webhook = await getWebhookForInstitution(institution).catch(
    () => undefined,
  );

  return (
    <Page
      header={{
        title: t("title"),
        description: t("description"),
      }}
    >
      <Suspense>
        {webhook ? (
          <WebhookView webhook={webhook} institutionId={institution} />
        ) : (
          <WebhookEmptyView institutionId={institution} />
        )}
      </Suspense>
    </Page>
  );
}
