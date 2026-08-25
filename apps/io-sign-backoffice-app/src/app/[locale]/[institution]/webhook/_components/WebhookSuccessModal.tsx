"use client";

import { useTranslations } from "next-intl";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { TextItemWithCopyAndHide } from "./TextItemWithCopyAndHide";

import Dialog from "@/components/Dialog";

type Props = {
  open: boolean;
  publicKey: string;
  publicKeyThumbprint: string;
  onDone: () => void;
  currentUrl: string;
};

export default function WebhookSuccessModal({
  open,
  publicKey,
  publicKeyThumbprint,
  onDone,
  currentUrl,
}: Props) {
  const t = useTranslations("firmaconio.webhook.successModal");
  const a = useTranslations("firmaconio.webhook.url");

  return (
    <Dialog open={open}>
      <Stack spacing={3}>
        <Typography variant="h6">{t("title")}</Typography>
        <Alert severity="warning" variant="outlined">
          {t("description")}
        </Alert>
        <Stack spacing={1}>
          <TextField
            label={a("changeUrlModal.urlLabel")}
            value={currentUrl}
            type="text"
            fullWidth
            inputProps={{ readOnly: true }}
          />
        </Stack>
        <TextItemWithCopyAndHide label={t("publicKey")} value={publicKey} />
        <TextItemWithCopyAndHide
          label={t("thumbprint")}
          value={publicKeyThumbprint}
        />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" onClick={onDone}>
            {t("done")}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
