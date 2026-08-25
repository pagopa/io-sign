import { Suspense } from "react";
import { notFound } from "next/navigation";

import Page from "@/components/Page";

import { isInstitutionAllowedForWebhook } from "@/lib/auth/use-cases";
import { getWebhookForInstitution } from "@/lib/webhooks/use-cases";

import WebhookView from "./_components/WebhookView";
import WebhookEmptyView from "./_components/WebhookEmptyView";

export default async function WebhookPage({
  params,
}: {
  params: Promise<{ institution: string }>;
}) {
  const { institution } = await params;

  if (!isInstitutionAllowedForWebhook(institution)) {
    notFound();
  }

  const webhook = await getWebhookForInstitution(institution).catch(
    () => undefined,
  );

  return (
    <Page>
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
