"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Dialog from "@/components/Dialog";
import { patchWebhook } from "@/lib/webhooks/client";

type Props = {
  open: boolean;
  onClose: () => void;
  institutionId: string;
  currentUrl: string;
};

export default function ChangeUrlModal({
  open,
  onClose,
  institutionId,
  currentUrl,
}: Props) {
  const t = useTranslations("firmaconio.webhook.url.changeUrlModal");
  const router = useRouter();

  const [url, setUrl] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isHttps = url.startsWith("https://");
  const urlError = url.length > 0 && !isHttps;

  const onConfirm = async () => {
    setError(false);
    setLoading(true);
    try {
      await patchWebhook({ institutionId, url });
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
        <TextField
          label={t("urlLabel")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          fullWidth
          type="url"
          autoFocus
          error={urlError}
          helperText={urlError ? t("errors.httpsRequired") : undefined}
        />
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
            loading={loading}
            onClick={onConfirm}
            disabled={!url || !isHttps || url === currentUrl}
          >
            {t("confirm")}
          </LoadingButton>
        </Stack>
      </Stack>
    </Dialog>
  );
}
