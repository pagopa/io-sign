"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Dialog from "@/components/Dialog";
import { deleteWebhook } from "@/lib/webhooks/client";

type Props = {
  open: boolean;
  onClose: () => void;
  institutionId: string;
};

export default function DeleteWebhookModal({
  open,
  onClose,
  institutionId,
}: Props) {
  const t = useTranslations("firmaconio.webhook.deleteModal");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const onConfirm = async () => {
    setError(false);
    setLoading(true);
    try {
      await deleteWebhook(institutionId);
      onClose();
      router.refresh();
    } catch (_e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Stack spacing={3}>
        <Typography variant="h6">{t("title")}</Typography>
        <Typography variant="body2">{t("description")}</Typography>
        {error && (
          <Alert severity="error" variant="outlined">
            {t("errors.generic")}
          </Alert>
        )}
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={loading}
            onClick={onConfirm}
          >
            {t("confirm")}
          </LoadingButton>
        </Stack>
      </Stack>
    </Dialog>
  );
}
