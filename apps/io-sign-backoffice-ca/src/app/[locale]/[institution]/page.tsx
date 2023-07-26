import { useTranslations } from "next-intl";

import { Stack, Typography, Button } from "@/components/mui";
import { IllusPaymentCompleted } from "@pagopa/mui-italia";

export default function Index() {
  const t = useTranslations("Index");
  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
      spacing={3}
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
