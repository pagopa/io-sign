"use client";

import Dialog, { Props as DialogProps } from "@/components/Dialog";

import { useTranslations } from "next-intl";

import { useEditableListForm, Options } from "./hooks";

import { Stack, Typography, TextField, Button } from "@mui/material";

export type Props = Omit<DialogProps, "children" | "onClose"> &
  Options & {
    title: string;
    description?: string;
    inputLabel: string;
    onClose: () => void;
  };

export default function EditItemModal({
  open,
  title,
  description,
  inputLabel,
  onClose,
  ...options
}: Props) {
  const { input, error, onChange, onClick } = useEditableListForm(options);
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
        <TextField
          autoComplete="off"
          size="small"
          label={inputLabel}
          onChange={onChange}
          value={input}
          error={error ? true : false}
          helperText={error?.message}
        />
        <Stack pt={2} spacing={2} direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={onClick}>
            {t("confirm")}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
