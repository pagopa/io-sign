import { Suspense } from "react";

import { useTranslations } from "next-intl";

import { Stack, Typography, Button } from "@mui/material";
import { IllusPaymentCompleted } from "@pagopa/mui-italia";

import Page from "@/components/Page";

import IssuerCard from "./_components/IssuerCard";
import SupportCard from "./_components/SupportCard";

export default function Index({ params }: { params: { institution: string } }) {
  if (
    process.env.NODE_ENV === "development" ||
    params.institution === "4a4149af-172e-4950-9cc8-63ccc9a6d865"
  ) {
    return <Overview params={params} />;
  }
  return <Confirm />;
}

function Confirm() {
  const t = useTranslations("Index");
  return (
    <Stack
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
      spacing={3}
      height={"100%"}
    >
      <IllusPaymentCompleted />
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4">{t("title")}</Typography>
        <Typography
          variant="body1"
          sx={{ whiteSpace: "pre-line" }}
          align="center"
        >
          {t.rich("body")}
        </Typography>
      </Stack>
      <Button variant="outlined" href={process.env.SELFCARE_URL}>
        {t("cta")}
      </Button>
    </Stack>
  );
}

function Overview({ params }: { params: { institution: string } }) {
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
