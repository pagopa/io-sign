"use client";

import { useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";

import { useTranslations } from "next-intl";

import { Stack, Typography } from "@mui/material";

import { CreateApiKeyPayload } from "@/lib/api-keys";

import IpAddressListInput from "@/components/IpAddressListInput";
import FiscalCodeListInput from "@/components/FiscalCodeListInput";

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
  const { setValue } = useFormContext<CreateApiKeyPayload>();
  const editModal = {
    description: t("editModal.description"),
  };
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
          <ListInput
            items={field.value}
            editModal={editModal}
            onChange={onEditableListChange}
          />
        )}
      />
    </Stack>
  );
}
