"use client";

import { useFormContext } from "react-hook-form";

import { Stack, Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { FormFields } from "./CreateApiKeyForm";

import NextLink from "next/link";

export type Props = {
  parent: {
    href: string;
  };
};

export default function FormActions({ parent }: Props) {
  const { formState } = useFormContext<FormFields>();
  return (
    <Stack direction="row" justifyContent="space-between">
      <Button variant="outlined" href={parent.href} LinkComponent={NextLink}>
        Indietro
      </Button>
      <LoadingButton
        type="submit"
        variant="contained"
        loading={formState.isSubmitting}
      >
        Continua
      </LoadingButton>
    </Stack>
  );
}
