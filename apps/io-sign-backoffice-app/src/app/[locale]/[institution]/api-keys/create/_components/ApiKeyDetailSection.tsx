"use client";

import { useFormContext, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Stack, Typography, Link, MenuItem, TextField } from "@mui/material";

import NextLink from "next/link";

import { FormFields } from "./CreateApiKeyForm";

export default function ApiKeyDetailSection({
  documentationUrl,
}: {
  documentationUrl: string;
}) {
  const { control } = useFormContext<FormFields>();

  const t = useTranslations("firmaconio.createApiKey.form.details");
  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Stack spacing={2}>
        <Typography variant="h6">{t("title")}</Typography>
        <Stack spacing={1}>
          <Typography variant="body1">{t("description")}</Typography>
          <Link
            color="primary"
            variant="body2"
            fontWeight={600}
            component={NextLink}
            href={documentationUrl}
          >
            {t("link.label")}
          </Link>
        </Stack>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="body2" fontWeight={600}>
          Seleziona l'ambiente
        </Typography>
        <Controller
          control={control}
          name="environment"
          render={({ field }) => (
            <TextField
              size="small"
              label="Seleziona l'ambiente"
              select
              disabled
              {...field}
              sx={{ width: "20ch" }}
            >
              <MenuItem value="test">test</MenuItem>
              <MenuItem value="prod">prod</MenuItem>
            </TextField>
          )}
        />
        <Stack spacing={2}>
          <Typography variant="body2" fontWeight={600}>
            Dai un nome alla tua API Key
          </Typography>
          <Controller
            control={control}
            name="displayName"
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                sx={{ width: "30ch" }}
                size="small"
                label="Inserisci un nome*"
                {...field}
              />
            )}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
