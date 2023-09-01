import { Stack, Typography, Button } from "@mui/material";
import { IllusPaymentCompleted } from "@pagopa/mui-italia";
import { useTranslations } from "next-intl";

import PageHeader from "@/components/PageHeader";
import Preview from "@/components/Preview";
import { VpnKey, VpnKeyOff } from "@mui/icons-material";

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

function Overview() {
  const t = useTranslations("firmaconio.overview");
  return (
    <Stack spacing={3}>
      <PageHeader title={t("title")} description={t("description")} />
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
    </Stack>
  );
}
