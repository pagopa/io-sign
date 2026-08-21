"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Dialog from "@/components/Dialog";
import { rotateWebhookKey } from "@/lib/webhooks/client";
import { RotateWebhookKeyResponse } from "@io-sign/io-sign/webhook";

import WebhookSuccessModal from "./WebhookSuccessModal";

type Props = {
  open: boolean;
  onClose: () => void;
  institutionId: string;
};

export default function RotateKeyModal({
  open,
  onClose,
  institutionId,
}: Props) {
  const t = useTranslations(
    "firmaconio.webhook.publicKeyThumbprint.rotateKeyModal",
  );
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [rotated, setRotated] = useState<RotateWebhookKeyResponse | null>(null);

  const onConfirm = async () => {
    setError(false);
    setLoading(true);
    try {
      const result = await rotateWebhookKey({ institutionId });
      setRotated(result);
    } catch (_e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setRotated(null);
    onClose();
    router.refresh();
  };

  if (rotated) {
    return (
      <WebhookSuccessModal
        open
        publicKey={rotated.publicKey}
        publicKeyThumbprint={rotated.publicKeyThumbprint}
        onDone={handleDone}
      />
    );
  }

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
            color="primary"
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
