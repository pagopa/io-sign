import { Stack, Typography, Button } from "@mui/material";
import { IllusPaymentCompleted } from "@pagopa/mui-italia";
import { useTranslations } from "next-intl";

import PageHeader from "@/components/PageHeader";
import { Suspense } from "react";
import Preview from "@/components/Preview";

export default function Index() {
  return (
    <Preview fallback={<Confirm />}>
      <Overview />
    </Preview>
  );
}

function Confirm() {
  const t = useTranslations("Index");
  return (
    <Stack alignItems="center" justifyContent="center" flexGrow={1} spacing={3}>
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

function LabelValueTable({
  entries,
}: {
  entries: Array<{ label: string; value: string }>;
}) {
  return (
    <Stack direction="column" spacing={3}>
      {entries.map(({ label, value }) => (
        <Stack direction={{ sx: "column", md: "row" }} key={label} spacing={2}>
          <Typography variant="body2" width={{ md: 157 }}>
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function InstitutionCard() {
  const t = useTranslations("firmaconio.overview.cards.institution");
  const entries = [
    {
      label: t("email.label"),
      value: "assistenza@genola.cn.it",
    },
  ];
  return (
    <Stack spacing={3} bgcolor="background.paper" p={3} flexGrow={1}>
      <Typography variant="h6">{t("title")}</Typography>
      <LabelValueTable entries={entries} />
      <div>
        <Button variant="contained" size="small">
          {t("cta")}
        </Button>
      </div>
    </Stack>
  );
}

function getX() {
  return [
    {
      environment: "test",
      emailAddress: "firmaconio-tech@pagopa.it",
    },
    {
      environment: "prod",
      emailAddress: "enti.firmaconio@pagopa.it",
    },
  ];
}

function SupportCard() {
  const t = useTranslations("firmaconio.overview.cards.support");
  const contacts = getX();
  const entries = contacts.map((contact) => ({
    label: t(`environments.${contact.environment}.label`),
    value: contact.emailAddress,
  }));
  return (
    <Stack spacing={3} bgcolor="background.paper" p={3} flexGrow={1}>
      <Stack spacing={2}>
        <Typography variant="h6">{t("title")}</Typography>
        <Typography variant="body2">{t("description")}</Typography>
      </Stack>
      <LabelValueTable entries={entries} />
    </Stack>
  );
}

function Overview() {
  const t = useTranslations("firmaconio.overview");
  return (
    <Stack spacing={3}>
      <PageHeader title={t("title")} description={t("description")} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Suspense>
          <InstitutionCard />
        </Suspense>
        <Suspense>
          <SupportCard />
        </Suspense>
      </Stack>
    </Stack>
  );
}
