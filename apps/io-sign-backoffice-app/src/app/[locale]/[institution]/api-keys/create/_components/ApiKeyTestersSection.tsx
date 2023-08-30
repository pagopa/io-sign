"use client";

import { useTranslations } from "next-intl";
import { useFormContext, Controller } from "react-hook-form";

import { Stack, Typography } from "@mui/material";

import FiscalCodeListInput from "@/components/FiscalCodeListInput";

import { FormFields } from "./CreateApiKeyForm";

export default function ApiKeyNetworkSection() {
  const t = useTranslations("firmaconio");
  const { setValue } = useFormContext<FormFields>();
  const onEditableListChange = (items: string[]) => {
    setValue("testers", items);
  };
  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Typography variant="h6">
        {t("createApiKey.form.testers.title")}
      </Typography>
      <Typography variant="body1">
        {t("createApiKey.form.testers.description")}
      </Typography>
      <Controller
        name="cidrs"
        render={({ field }) => (
          <FiscalCodeListInput
            value={field.value}
            onChange={onEditableListChange}
          />
        )}
      />
    </Stack>
  );
}
