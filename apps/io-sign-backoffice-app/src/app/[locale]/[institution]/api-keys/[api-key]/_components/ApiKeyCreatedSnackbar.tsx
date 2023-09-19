"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Snackbar, Alert } from "@mui/material";

export default function ApiKeyCreatedSnackbar() {
  const t = useTranslations("firmaconio.apiKey.feedbacks");
  const [open, setOpen] = useState(false);

  const searchParams = useSearchParams();
  const created = searchParams.get("created");

  useEffect(() => {
    if (created) {
      setOpen(true);
    }
  }, [created]);

  const onClose = () => setOpen(false);

  return (
    <Snackbar
      open={open}
      onClose={onClose}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity="success" variant="outlined">
        {t("created")}
      </Alert>
    </Snackbar>
  );
}
