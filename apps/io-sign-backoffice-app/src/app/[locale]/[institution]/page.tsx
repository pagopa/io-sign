import { Suspense } from "react";

import { getTranslations } from "next-intl/server";

import { Stack } from "@mui/material";

import Page from "@/components/Page";

import IssuerCard from "./_components/IssuerCard";
import SupportCard from "./_components/SupportCard";

export default async function Overview({
  params,
}: {
  params: Promise<{ institution: string }>;
}) {
  const { institution } = await params;
  const t = await getTranslations("firmaconio.overview");
  const header = {
    title: t("title"),
    description: t("description"),
  };
  return (
    <Page header={header}>
      <Stack
        direction="row"
        justifyContent="stretch"
        alignItems="stretch"
        spacing={2}
      >
        <Suspense>
          <IssuerCard institutionId={institution} />
          <SupportCard />
        </Suspense>
      </Stack>
    </Page>
  );
}
