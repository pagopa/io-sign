import { useTranslations } from "next-intl";

import { Stack, Typography } from "@mui/material";

import Link from "@/components/Link";

type Props = {
  showAction?: boolean;
};

export default function ApiKeyEmptyTable({ showAction = true }: Props) {
  const t = useTranslations("firmaconio.apiKeys");
  return (
    <Stack
      p={2}
      spacing={1}
      direction="row"
      justifyContent="center"
      bgcolor="background.paper"
    >
      <Typography variant="body2">{t("list.empty")}</Typography>
      {showAction && <Link href="api-keys/create">{t("list.action")}.</Link>}
    </Stack>
  );
}
