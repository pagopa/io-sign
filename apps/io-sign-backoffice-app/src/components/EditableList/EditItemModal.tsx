"use client";

import Dialog, { Props as DialogProps } from "@/components/Dialog";

import { Stack, Typography, TextField, Button } from "@mui/material";

export type Props = Omit<DialogProps, "children"> & {
  title: string;
  description: string;
  inputLabel: string;
};

export default function EditItemModal({
  open,
  onClose,
  title,
  description,
  inputLabel,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2">{description}</Typography>
        </Stack>
        <TextField size="medium" label={inputLabel} />
        <Stack pt={2} spacing={2} direction="row" justifyContent="flex-end">
          <Button variant="outlined">Annulla</Button>
          <Button variant="contained">Modifica</Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
