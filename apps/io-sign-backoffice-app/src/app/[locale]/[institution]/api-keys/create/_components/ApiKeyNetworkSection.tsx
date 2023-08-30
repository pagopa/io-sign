"use client";

import { useTranslations } from "next-intl";
import { useFormContext, Controller } from "react-hook-form";

import { Stack, Typography } from "@mui/material";

import IpAddressListInput from "@/components/IpAddressListInput";

import { FormFields } from "./CreateApiKeyForm";

export default function ApiKeyNetworkSection() {
  const t = useTranslations("firmaconio");

  const { setValue } = useFormContext<FormFields>();

  const onEditableListChange = (items: string[]) => {
    setValue("cidrs", items);
  };

  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Typography variant="h6">
        {t("createApiKey.form.network.title")}
      </Typography>
      <Typography variant="body1">
        {t("createApiKey.form.network.description")}
      </Typography>
      <Controller
        name="cidrs"
        render={({ field }) => (
          <IpAddressListInput
            value={field.value}
            onChange={onEditableListChange}
          />
        )}
      />
    </Stack>
  );
}
