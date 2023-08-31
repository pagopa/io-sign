"use client";

import { useMemo, useState, useContext } from "react";

import { Stack, Typography } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

import { useTranslations } from "next-intl";

import FiscalCodeListInput from "@/components/FiscalCodeListInput";
import IpAddressListInput from "@/components/IpAddressListInput";

import { Props as EditableListProps } from "@/components/EditableList";

import { ApiKeyContext } from "@/lib/api-keys/client";

type Props = {
  field: "cidrs" | "testers";
  i18n: {
    namespace: string;
  };
  icon?: SvgIconComponent;
};

export default function ApiKeyEditableFieldCard({
  field,
  i18n: { namespace },
  icon: Icon,
}: Props) {
  const t = useTranslations(namespace);

  const apiKey = useContext(ApiKeyContext);

  if (!apiKey) {
    throw new Error("cannot load ApiKey from context");
  }

  const [value] = useState(apiKey[field]);

  const editModal: Partial<EditableListProps["editModal"]> = {
    description: t("editModal.description"),
  };

  const onChange = async (items: unknown[]) => {
    await fetch(
      `/api/institutions/${apiKey.institutionId}/api-keys/${apiKey.id}`,
      {
        method: "PATCH",
        body: JSON.stringify([
          {
            op: "replace",
            path: `/${field}`,
            value: items,
          },
        ]),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };

  const ListInput = useMemo(
    () => (field === "cidrs" ? IpAddressListInput : FiscalCodeListInput),
    [field]
  );

  return (
    <Stack spacing={3} p={3} bgcolor="background.paper">
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          {Icon && <Icon fontSize="small" />}
          <Typography variant="sidenav">{t("title")}</Typography>
        </Stack>
        <Typography variant="body2">{t("description")}</Typography>
      </Stack>
      <ListInput
        value={value}
        editModal={editModal}
        onChange={onChange}
        disabled={apiKey.status === "revoked"}
      />
    </Stack>
  );
}
