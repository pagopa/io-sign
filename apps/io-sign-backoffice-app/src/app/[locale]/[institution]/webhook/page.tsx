import { Suspense } from "react";

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
