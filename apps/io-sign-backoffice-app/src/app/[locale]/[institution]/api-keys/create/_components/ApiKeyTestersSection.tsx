"use client";

import { useTranslations } from "next-intl";
import { useFormContext, Controller } from "react-hook-form";

import { Stack, Typography } from "@mui/material";

import EditableList from "@/components/EditableList";

import { fiscalCodeSchema } from "@/lib/api-key";

import { FormFields } from "./CreateApiKeyForm";

export default function ApiKeyNetworkSection() {
  const t = useTranslations("firmaconio.createApiKey.form.testers");
  const { setValue } = useFormContext<FormFields>();
  const onEditableListChange = (items: string[]) => {
    setValue("testers", items);
  };
  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Typography variant="h6">{t("title")}</Typography>
      <Typography variant="body1">{t("description")}</Typography>
      <Controller
        name="cidrs"
        render={({ field }) => (
          <EditableList
            schema={fiscalCodeSchema}
            value={field.value}
            onChange={onEditableListChange}
            addItemButtonLabel={t("list.addItemButtonLabel")}
            inputLabel={t("list.inputLabel")}
          />
        )}
      />
    </Stack>
  );
}