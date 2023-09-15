"use client";

import Dialog, { Props as DialogProps } from "@/components/Dialog";

import { useTranslations } from "next-intl";

import { Stack, Typography, Button } from "@mui/material";

export type Props = Omit<DialogProps, "children" | "onClose"> & {
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteItemModal({
  open,
  title,
  description,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("firmaconio.modals.actions");
  return (
    <Dialog open={open} onClose={onClose}>
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Typography variant="h6">{title}</Typography>
          {description && (
            <Typography variant="body2">{description}</Typography>
          )}
        </Stack>
        <Stack pt={2} spacing={2} direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={onConfirm}>
            {t("deleteConfirm")}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
