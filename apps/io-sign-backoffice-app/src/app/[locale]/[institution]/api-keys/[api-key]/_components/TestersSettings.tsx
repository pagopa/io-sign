"use client";

import { useState } from "react";

import { Stack, Typography } from "@mui/material";
import { PeopleAlt } from "@mui/icons-material";

import { useTranslations } from "next-intl";

import FiscalCodeListInput from "@/components/FiscalCodeListInput";
import { Props as EditableListProps } from "@/components/EditableList";

type Props = {
  fiscalCodes: Array<string>;
  disabled?: boolean;
};

export default function TestersSettings({
  fiscalCodes,
  disabled = false,
}: Props) {
  const t = useTranslations("firmaconio.apiKey.testers");

  const [value, setValue] = useState(fiscalCodes);

  const editModal: EditableListProps["editModal"] = {
    title: t("modals.editFiscalCodes.title"),
    description: t("apiKey.testers.editModal.description"),
  };

  const onChange = (fiscalCodes: string[]) => {
    console.log(fiscalCodes);
  };

  return (
    <Stack spacing={3} p={3} bgcolor="background.paper">
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PeopleAlt fontSize="small" />
          <Typography variant="sidenav">{t("title")}</Typography>
        </Stack>
        <Typography variant="body2">{t("description")}</Typography>
      </Stack>
      <FiscalCodeListInput
        value={value}
        editModal={editModal}
        onChange={onChange}
        disabled={disabled}
      />
    </Stack>
  );
}
