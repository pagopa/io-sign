import { Stack, Typography, Button } from "@mui/material";
import { IllusPaymentCompleted } from "@pagopa/mui-italia";
import { useTranslations } from "next-intl";

import Page from "@/components/Page";

export default function Index({ params }: { params: { institution: string } }) {
  if (
    process.env.NODE_ENV === "development" ||
    params.institution === "4a4149af-172e-4950-9cc8-63ccc9a6d865"
  ) {
    return <Overview />;
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

function Overview() {
  const t = useTranslations("firmaconio.overview");

  const header = {
    title: t("title"),
    description: t("description"),
  };

  return (
    <Page header={header}>
      <Stack p={2} spacing={2} bgcolor="background.paper">
        <Typography variant="body1">
          Ciao! 👋 Ti trovi in questa pagina, perché fai parte del test del
          pannello backoffice di Firma con IO.
        </Typography>
        <Typography variant="body1">
          Per iniziare il test, seleziona la voce <strong>Api Key</strong> dal
          menu.
        </Typography>
      </Stack>
    </Page>
  );
}
