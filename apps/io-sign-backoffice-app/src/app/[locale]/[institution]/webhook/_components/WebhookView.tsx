"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Button,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  BugReportRounded,
  EditRounded,
  KeyRounded,
  PinDrop,
} from "@mui/icons-material";

import { Webhook } from "@/lib/webhooks";

import ChangeStatusModal from "./ChangeStatusModal";
import ChangeUrlModal from "./ChangeUrlModal";
import RotateKeyModal from "./RotateKeyModal";
import DeleteWebhookModal from "./DeleteWebhookModal";
import { TextItemWithCopyAndHide } from "./TextItemWithCopyAndHide";
import PageHeader from "@/components/Page/PageHeader";

type Props = {
  webhook: Webhook;
  institutionId: string;
  canDelete: boolean;
};

export default function WebhookView({
  webhook,
  institutionId,
  canDelete,
}: Props) {
  const t = useTranslations("firmaconio.webhook");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [rotateKeyModalOpen, setRotateKeyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhook.publicKeyThumbprint);
    setCopied(true);
  };

  const handleSnackbarClose = () => {
    setCopied(false);
  };

  return (
    <Stack spacing={3}>
      <PageHeader title={t("title")} description={t("description")} />

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
                value={webhook.status}
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

            <Stack direction="row" alignItems="center" spacing={2} pt={2}>
              <Stack sx={{ width: "40ch" }}>
                <TextItemWithCopyAndHide
                  label={t("publicKeyThumbprint.title")}
                  value={webhook.publicKeyThumbprint}
                  showCopyButton={false}
                />
              </Stack>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleCopy()}
              >
                {t("publicKeyThumbprint.copyButton")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setRotateKeyModalOpen(true)}
              >
                {t("publicKeyThumbprint.rotateKey")}
              </Button>
            </Stack>
            <Snackbar
              open={copied}
              onClose={handleSnackbarClose}
              autoHideDuration={3000}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Alert severity="success" variant="outlined">
                {t("publicKeyThumbprint.copiedAlert")}
              </Alert>
            </Snackbar>
          </Stack>
        </Paper>
      </Stack>

      {canDelete && (
        <Paper
          variant="outlined"
          sx={{ borderStyle: "dashed", borderColor: "warning.main" }}
        >
          <Stack p={3} spacing={2} bgcolor="background.paper">
            <Stack direction="row" alignItems="center" spacing={1}>
              <BugReportRounded color="warning" />
              <Typography variant="body1" fontWeight={600} color="warning.main">
                {t("devTools.title")}
              </Typography>
            </Stack>
            <Typography variant="body2">{t("devTools.description")}</Typography>
            <Stack direction="row">
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteModalOpen(true)}
              >
                {t("devTools.deleteButton")}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

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
        currentUrl={webhook.url}
      />

      <DeleteWebhookModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        institutionId={institutionId}
      />
    </Stack>
  );
}
