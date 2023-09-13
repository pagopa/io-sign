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

export type Props = {
  secret: string;
  disabled?: boolean;
};

export default function ApiKeySecretForm({ secret, disabled = false }: Props) {
  const [show, setShow] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const t = useTranslations("firmaconio.apiKey");
  const toggleSecretVisibility = () => {
    setShow((currentState) => !currentState);
  };
  const copyToClipboard = () => {
    window.navigator.clipboard.writeText(secret);
    setFeedback(true);
  };
  const onSnackbarClose = () => setFeedback(false);
  return (
    <Stack direction="row" spacing={1}>
      <TextField
        InputProps={{
          readOnly: true,
        }}
        value={show ? secret : "XXXXXXXXXXXXXXXX"}
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
  );
}
