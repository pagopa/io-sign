"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Dialog from "@/components/Dialog";
import { createWebhook } from "@/lib/webhooks/client";

import WebhookSuccessModal from "./WebhookSuccessModal";
import { CreateWebhookResponse } from "@io-sign/io-sign/webhook";

type Props = {
  open: boolean;
  onClose: () => void;
  institutionId: string;
};

export default function ConfigureWebhookModal({
  open,
  onClose,
  institutionId,
}: Props) {
  const t = useTranslations("firmaconio.webhook.configureModal");
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [created, setCreated] = useState<CreateWebhookResponse | null>(null);

  const isHttps = url.startsWith("https://");
  const urlError = url.length > 0 && !isHttps;

  const onSubmit = async () => {
    setError(false);
    setLoading(true);
    try {
      const result = await createWebhook({ institutionId, url });
      setCreated(result);
    } catch (_e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setCreated(null);
    onClose();
    router.refresh();
  };

  if (created) {
    return (
      <WebhookSuccessModal
        open
        publicKey={created.publicKey}
        publicKeyThumbprint={created.publicKeyThumbprint}
        onDone={handleDone}
      />
    );
  }

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
            onClick={onSubmit}
            disabled={!url || !isHttps}
          >
            {t("confirm")}
          </LoadingButton>
        </Stack>
      </Stack>
    </Dialog>
  );
}
