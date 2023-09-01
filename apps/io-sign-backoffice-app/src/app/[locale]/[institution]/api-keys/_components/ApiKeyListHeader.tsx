import { useTranslations } from "next-intl";

import { Stack, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";

export type Props = {
  showAction?: boolean;
};

export default function ApiKeyListHeader({ showAction = true }: Props) {
  const t = useTranslations("firmaconio.apiKeys.list");
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="h6">{t("title")}</Typography>
      {showAction && (
        <Button
          size="small"
          variant="contained"
          href="api-keys/create"
          startIcon={<Add />}
        >
          {t("action")}
        </Button>
      )}
    </Stack>
  );
}
