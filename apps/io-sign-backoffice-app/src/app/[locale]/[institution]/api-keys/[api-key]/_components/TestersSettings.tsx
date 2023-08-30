"use client";

import { useState } from "react";

import { Stack, Typography } from "@mui/material";
import { PeopleAlt } from "@mui/icons-material";

import { useTranslations } from "next-intl";

import FiscalCodeListInput from "@/components/FiscalCodeListInput";
import { Props as EditableListProps } from "@/components/EditableList";
import { ApiKey } from "@/lib/api-keys";

type Props = {
  apiKey: ApiKey;
};

export default function TestersSettings({
  apiKey: { id, institutionId, testers, status },
}: Props) {
  const t = useTranslations("firmaconio.apiKey.testers");

  const [value, setValue] = useState(testers);

  const editModal: EditableListProps["editModal"] = {
    title: t("modals.editFiscalCodes.title"),
    description: t("apiKey.testers.editModal.description"),
  };

  const onChange = async (fiscalCodes: string[]) => {
    const response = await fetch(
      `/api/institutions/${institutionId}/api-keys/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify([
          {
            op: "replace",
            path: "/testers",
            value: fiscalCodes,
          },
        ]),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const json = await response.json();
    console.log(json);
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
        disabled={status === "revoked"}
      />
    </Stack>
  );
}
