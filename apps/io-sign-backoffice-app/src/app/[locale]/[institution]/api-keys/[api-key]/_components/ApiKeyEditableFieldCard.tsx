"use client";

import { useMemo, useState, useContext } from "react";

import { Alert, Snackbar, Stack, Typography } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

import { useTranslations } from "next-intl";

import FiscalCodeListInput from "@/components/FiscalCodeListInput";
import IpAddressListInput from "@/components/IpAddressListInput";

import { Props as EditableListProps } from "@/components/EditableList";

import { ApiKeyContext, upsertApiKeyField } from "@/lib/api-keys/client";

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
  const [showError, setShowError] = useState(false);
  const apiKey = useContext(ApiKeyContext);
  if (!apiKey) {
    throw new Error("cannot load ApiKey from context");
  }
  const [items, setItems] = useState<string[]>(apiKey[field]);
  const editModal: Partial<EditableListProps["editModal"]> = {
    description: t("editModal.description"),
  };
  const onChange = async (updated: string[]) => {
    setItems(updated);
    try {
      await upsertApiKeyField(apiKey, field, updated);
    } catch (e) {
      setShowError(true);
      setItems(items);
    }
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
        items={items}
        editModal={editModal}
        onChange={onChange}
        disabled={apiKey.status === "revoked"}
      />
      <Snackbar
        open={showError}
        onClose={() => setShowError(false)}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error" variant="outlined">
          {t("errors.update")}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
