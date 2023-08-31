"use client";

import { useFormContext, Controller } from "react-hook-form";

import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { Stack, Typography, Link, MenuItem, TextField } from "@mui/material";

import { CreateApiKeyPayload } from "@/lib/api-keys";

export default function ApiKeyMetadataCard() {
  const {
    formState: { errors },
  } = useFormContext<CreateApiKeyPayload>();

  const t = useTranslations("firmaconio.createApiKey.form.general");
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
            href="#"
          >
            {t("link.label")}
          </Link>
        </Stack>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="body2" fontWeight={600}>
          {t("environment.label")}
        </Typography>
        <Controller
          name="environment"
          render={({ field }) => (
            <TextField
              size="small"
              label={t("environment.inputLabel")}
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
            {t("displayName.label")}
          </Typography>
          <Controller
            name="displayName"
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                error={errors.displayName ? true : false}
                helperText={errors.displayName?.message}
                sx={{ width: "30ch" }}
                size="small"
                label={t("displayName.inputLabel")}
                {...field}
              />
            )}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
