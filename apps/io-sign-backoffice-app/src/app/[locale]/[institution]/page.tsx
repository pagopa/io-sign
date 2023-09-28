import { Suspense } from "react";

import { useTranslations } from "next-intl";

import { Stack } from "@mui/material";

import Page from "@/components/Page";

import IssuerCard from "./_components/IssuerCard";
import SupportCard from "./_components/SupportCard";

export default function Overview({
  params,
}: {
  params: { institution: string };
}) {
  const t = useTranslations("firmaconio.overview");
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
          <IssuerCard institutionId={params.institution} />
          <SupportCard />
        </Suspense>
      </Stack>
    </Page>
  );
}
