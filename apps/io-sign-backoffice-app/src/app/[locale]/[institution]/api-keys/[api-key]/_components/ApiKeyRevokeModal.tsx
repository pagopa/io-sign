"use client";

import Dialog, { Props as DialogProps } from "@/components/Dialog";

import { useTranslations } from "next-intl";

import { Stack, Typography, Button } from "@mui/material";

export type Props = Omit<DialogProps, "children" | "onClose"> & {
  onClose: () => void;
  onConfirm: () => void;
};

export default function ApiKeyRevokeModal({ open, onClose, onConfirm }: Props) {
  const t = useTranslations("firmaconio");
  return (
    <Dialog open={open} onClose={onClose}>
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Typography variant="h6">{t("apiKey.revoke.modal.title")}</Typography>
          <Typography variant="body2">
            {t("apiKey.revoke.modal.description")}
          </Typography>
        </Stack>
        <Stack pt={2} spacing={2} direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            {t("modals.actions.cancel")}
          </Button>
          <Button variant="contained" onClick={onConfirm}>
            {t("apiKey.revoke.modal.confirm")}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
