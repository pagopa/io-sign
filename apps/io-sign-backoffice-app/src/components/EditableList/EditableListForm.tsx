"use client";

import { useState, useEffect, ChangeEvent } from "react";

import { Button, Stack, TextField } from "@mui/material";

import { z } from "zod";

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
  const [input, setInput] = useState("");

  const [error, setError] = useState<{ message: string } | undefined>(
    undefined
  );

  const validate = (item: string) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      const issue = result.error.issues.at(0);
      const message = issue
        ? issue.message
        : "Si è verificato un errore imprevisto";
      return { success: false, error: { message } };
    }
    return { success: true };
  };

  const onClick = () => {
    const result = validate(input);
    if (result.success) {
      onConfirm(input);
    } else {
      setError(result.error);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setInput(e.target.value);

  useEffect(() => {
    if (error) {
      const result = validate(input);
      setError(result.success ? undefined : result.error);
    }
  }, [input]);

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
