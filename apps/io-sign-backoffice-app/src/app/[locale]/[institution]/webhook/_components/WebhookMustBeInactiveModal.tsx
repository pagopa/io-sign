"use client";

import { useTranslations } from "next-intl";
import { Button, Stack, Typography } from "@mui/material";

import Dialog from "@/components/Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function WebhookMustBeInactiveModal({ open, onClose }: Props) {
  const t = useTranslations("firmaconio.webhook.activeWarningModal");

  return (
    <Dialog open={open} onClose={onClose}>
      <Stack spacing={3}>
        <Typography variant="h6">{t("title")}</Typography>
        <Typography variant="body2">{t("description")}</Typography>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" color="primary" onClick={onClose}>
            {t("close")}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
