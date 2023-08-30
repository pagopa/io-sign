"use client";

import { useState } from "react";

import { Stack, Typography } from "@mui/material";
import { PinDrop } from "@mui/icons-material";

import { useTranslations } from "next-intl";

import IpAddressListInput from "@/components/IpAddressListInput";
import { Props as EditableListProps } from "@/components/EditableList";

type Props = {
  cidrs: Array<string>;
  disabled?: boolean;
};

export default function NetworkSettings({ cidrs, disabled = false }: Props) {
  const t = useTranslations("firmaconio");

  const [value, setValue] = useState(cidrs);

  const editModal: EditableListProps["editModal"] = {
    title: t("modals.editIpAddress.title"),
    description: t("apiKey.network.editModal.description"),
  };

  const onChange = (cidrs: string[]) => {
    console.log(cidrs);
  };

  return (
    <Stack spacing={3} p={3} bgcolor="background.paper">
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PinDrop fontSize="small" />
          <Typography variant="sidenav">{t("apiKey.network.title")}</Typography>
        </Stack>
        <Typography variant="body2">
          {t("apiKey.network.description")}
        </Typography>
      </Stack>
      <IpAddressListInput
        value={value}
        editModal={editModal}
        onChange={onChange}
        disabled={disabled}
      />
    </Stack>
  );
}
