"use client";

// ApiKeySecretForm renders a form that gives user the ability
// to show or copy secret (such as API Token or passwords).

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  Stack,
  Button,
  IconButton,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";

import { VisibilityOff, Visibility } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";

import ApiKeyRevokeModal from "./ApiKeyRevokeModal";
import { upsertApiKeyField } from "@/lib/api-keys/client";
import { ApiKeyWithSecret } from "@/lib/api-keys";
import { useRouter } from "next/navigation";

export type Props = {
  apiKey: ApiKeyWithSecret;
  disabled?: boolean;
};

export default function ApiKeySecretForm({ apiKey, disabled = false }: Props) {
  const router = useRouter();

  const [show, setShow] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const onRevokeModalClose = () => setRevokeModal(false);

  const onRevokeModalConfirm = async () => {
    setRevokeLoading(true);
    setRevokeModal(false);
    await upsertApiKeyField(apiKey, "status", "revoked");
    router.refresh();
  };

  const revoke = () => setRevokeModal(true);

  const t = useTranslations("firmaconio.apiKey");

  const toggleSecretVisibility = () => {
    setShow((currentState) => !currentState);
  };
  const copyToClipboard = () => {
    window.navigator.clipboard.writeText(apiKey.secret);
    setFeedback(true);
  };
  const onSnackbarClose = () => setFeedback(false);
  return (
    <Stack direction="row" spacing={2}>
      <Stack direction="row" spacing={1}>
        <TextField
          InputProps={{
            readOnly: true,
          }}
          value={show ? apiKey.secret : "XXXXXXXXXXXXXXXX"}
          size="small"
          sx={{ width: "40ch" }}
          disabled={disabled}
          type={show ? "text" : "password"}
        />
        <IconButton
          disabled={disabled}
          color="primary"
          onClick={toggleSecretVisibility}
        >
          {show ? (
            <Visibility fontSize="inherit" />
          ) : (
            <VisibilityOff fontSize="inherit" />
          )}
        </IconButton>
        <Button
          size="small"
          variant="contained"
          disabled={disabled}
          onClick={copyToClipboard}
        >
          {t("secret.copyButton")}
        </Button>
        <Snackbar
          open={feedback}
          onClose={onSnackbarClose}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity="success" variant="outlined">
            {t("feedbacks.copied")}
          </Alert>
        </Snackbar>
      </Stack>
      {apiKey.status === "active" && (
        <LoadingButton
          loading={revokeLoading}
          disabled={disabled}
          onClick={revoke}
          size="small"
          variant="outlined"
          color="error"
        >
          {t("revoke.button")}
        </LoadingButton>
      )}
      <ApiKeyRevokeModal
        open={revokeModal}
        onClose={onRevokeModalClose}
        onConfirm={onRevokeModalConfirm}
      />
    </Stack>
  );
}
