"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";

import { Stack, Typography } from "@mui/material";

import IpAddressListInput from "@/components/IpAddressListInput";
import FiscalCodeListInput from "@/components/FiscalCodeListInput";

import { FormFields } from "./CreateApiKeyForm";

type Props = {
  field: "cidrs" | "testers";
  i18n: {
    namespace: string;
  };
};

export default function ApiKeyEditableFieldCard({
  field,
  i18n: { namespace },
}: Props) {
  const t = useTranslations(namespace);
  const { setValue } = useFormContext<FormFields>();
  const onEditableListChange = (items: string[]) => {
    setValue(field, items);
  };
  const ListInput = useMemo(
    () => (field === "cidrs" ? IpAddressListInput : FiscalCodeListInput),
    [field]
  );
  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Typography variant="h6">{t("title")}</Typography>
      <Typography variant="body1">{t("description")}</Typography>
      <Controller
        name={field}
        render={({ field }) => (
          <ListInput items={field.value} onChange={onEditableListChange} />
        )}
      />
    </Stack>
  );
}
