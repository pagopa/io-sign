"use client";

import { Button, Stack, TextField } from "@mui/material";
import { useEditableListForm, Options } from "./hooks";
import { useCallback } from "react";

export type Props = Options & {
  inputLabel: string;
  onBlur?: () => void;
};

export default function EditableListForm({
  schema,
  onConfirm,
  onBlur,
  inputLabel,
}: Props) {
  const { input, error, onChange, onClick, reset } = useEditableListForm({
    schema,
    onConfirm,
  });

  const onTextFieldBlur = useCallback(() => {
    if (input.length === 0 && onBlur) {
      reset();
      onBlur();
    }
  }, [input, onBlur, reset]);

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        autoComplete="off"
        size="small"
        label={inputLabel}
        onChange={onChange}
        onBlur={onTextFieldBlur}
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
