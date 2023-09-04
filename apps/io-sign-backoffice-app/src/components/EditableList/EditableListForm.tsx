"use client";

import { Button, Stack, TextField } from "@mui/material";
import { useEditableListForm, Options } from "./hooks";

export type Props = Options & {
  inputLabel: string;
};

export default function EditableListForm({
  schema,
  onConfirm,
  inputLabel,
}: Props) {
  const { input, error, onChange, onClick } = useEditableListForm({
    schema,
    onConfirm,
  });
  return (
    <Stack direction="row" spacing={2}>
      <TextField
        autoComplete="off"
        size="small"
        label={inputLabel}
        onChange={onChange}
        value={input}
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
