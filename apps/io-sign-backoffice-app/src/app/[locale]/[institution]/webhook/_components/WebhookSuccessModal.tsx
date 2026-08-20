"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ContentCopy, Visibility, VisibilityOff } from "@mui/icons-material";

import Dialog from "@/components/Dialog";

type Props = {
  open: boolean;
  publicKey: string;
  publicKeyThumbprint: string;
  onDone: () => void;
};

function ObscuredField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const t = useTranslations("firmaconio.webhook.successModal");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack spacing={1}>
      <TextField
        label={label}
        value={visible ? value : "•".repeat(Math.min(value.length, 40))}
        fullWidth
        inputProps={{ readOnly: true, style: { fontFamily: "monospace" } }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={visible ? "Nascondi" : "Mostra"}>
                <IconButton
                  onClick={() => setVisible((v) => !v)}
                  edge="end"
                  size="small"
                >
                  {visible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              <Tooltip title={copied ? "Copiato!" : t("copy")}>
                <IconButton onClick={handleCopy} edge="end" size="small">
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}

export default function WebhookSuccessModal({
  open,
  publicKey,
  publicKeyThumbprint,
  onDone,
}: Props) {
  const t = useTranslations("firmaconio.webhook.successModal");

  return (
    <Dialog open={open}>
      <Stack spacing={3}>
        <Typography variant="h6">{t("title")}</Typography>
        <Alert severity="warning" variant="outlined">
          {t("description")}
        </Alert>
        <ObscuredField label={t("publicKey")} value={publicKey} />
        <ObscuredField label={t("thumbprint")} value={publicKeyThumbprint} />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" onClick={onDone}>
            {t("done")}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
