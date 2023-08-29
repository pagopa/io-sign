"use client";

import { z } from "zod";
import { Button, Stack, TextField } from "@mui/material";
import { useEditableListForm } from "./hooks";

export type Props = {
  schema: z.ZodSchema<string>;
  onConfirm: (item: string) => void;
  inputLabel: string;
};

export default function EditableListForm({
  schema,
  onConfirm,
  inputLabel,
}: Props) {
  const { error, onChange, onClick } = useEditableListForm(schema, onConfirm);
  return (
    <Stack direction="row" spacing={2}>
      <TextField
        size="small"
        label={inputLabel}
        onChange={onChange}
        error={error ? true : false}
        helperText={error?.message}
      />
      <Button
        variant="text"
        size="small"
        onClick={onClick}
        disabled={error ? true : false}
      >
        Conferma
      </Button>
    </Stack>
  );
}
