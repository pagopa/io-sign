"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { EditRounded, KeyRounded, PinDrop } from "@mui/icons-material";

import { Webhook } from "@/lib/webhooks";

import ChangeStatusModal from "./ChangeStatusModal";
import ChangeUrlModal from "./ChangeUrlModal";
import RotateKeyModal from "./RotateKeyModal";

type Props = {
  webhook: Webhook;
  institutionId: string;
};

export default function WebhookView({ webhook, institutionId }: Props) {
  const t = useTranslations("firmaconio.webhook");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [rotateKeyModalOpen, setRotateKeyModalOpen] = useState(false);

  return (
    <>
      <Stack spacing={3}>
        <Paper variant="outlined">
          <Stack p={3} spacing={3} bgcolor="background.paper">
            <Stack direction="row" alignItems="center" spacing={1}>
              <PinDrop color="inherit" />
              <Typography variant="body1" fontWeight={600}>
                {t("status.title")}
              </Typography>
            </Stack>
            <Typography variant="body1">{t("status.description")}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                value="aaaa"
                checked={webhook.status === "active"}
                onChange={() => setStatusModalOpen(true)}
              />
              <Typography variant="body2" fontWeight={600}>
                {webhook.status === "active"
                  ? t("status.active")
                  : t("status.inactive")}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined">
          <Stack p={3} spacing={3} bgcolor="background.paper">
            <Stack direction="row" alignItems="center" spacing={1}>
              <PinDrop color="inherit" />
              <Typography variant="body1" fontWeight={600}>
                {t("url.title")}
              </Typography>
            </Stack>
            <Typography variant="body1">{t("url.description")}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                {webhook.url}
              </Typography>
              <IconButton
                size="small"
                color="primary"
                onClick={() => setUrlModalOpen(true)}
              >
                <EditRounded />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined">
          <Stack p={3} spacing={3} bgcolor="background.paper">
            <Stack direction="row" alignItems="center" spacing={1}>
              <KeyRounded color="inherit" />
              <Typography variant="body1" fontWeight={600}>
                {t("publicKeyThumbprint.title")}
              </Typography>
            </Stack>
            <Typography variant="body1">
              {t("publicKeyThumbprint.description")}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <TextField
                value={webhook.publicKeyThumbprint}
                autoComplete="off"
                size="small"
                type="password"
              />
              <Button
                variant="outlined"
                size="small"
                color="primary"
                onClick={() => setRotateKeyModalOpen(true)}
              >
                {t("publicKeyThumbprint.rotateKey")}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <ChangeStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        institutionId={institutionId}
        currentStatus={webhook.status}
      />

      <ChangeUrlModal
        open={urlModalOpen}
        onClose={() => setUrlModalOpen(false)}
        institutionId={institutionId}
        currentUrl={webhook.url}
      />

      <RotateKeyModal
        open={rotateKeyModalOpen}
        onClose={() => setRotateKeyModalOpen(false)}
        institutionId={institutionId}
      />
    </>
  );
}
