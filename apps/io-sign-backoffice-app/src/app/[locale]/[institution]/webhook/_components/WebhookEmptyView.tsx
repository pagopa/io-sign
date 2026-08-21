"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Link, Paper, Stack, Typography } from "@mui/material";
import NextLink from "next/link";

import ConfigureWebhookModal from "./ConfigureWebhookModal";
import { Add } from "@mui/icons-material";

type Props = {
  institutionId: string;
};

export default function WebhookEmptyView({ institutionId }: Props) {
  const t = useTranslations("firmaconio.webhook");
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          {t("configure")}
        </Button>
      </Stack>
      <Paper variant="outlined">
        <Stack
          p={3}
          spacing={3}
          direction="row"
          bgcolor="background.paper"
          alignItems="center"
          sx={{ justifyContent: "center" }}
        >
          <Typography variant="body1">
            {t.rich("empty", {
              pp: (label) => (
                <Link
                  href="#"
                  component={NextLink}
                  onClick={() => setOpen(true)}
                  underline="none"
                  fontWeight="bold"
                >
                  {label}
                </Link>
              ),
            })}
          </Typography>
        </Stack>
      </Paper>
      <ConfigureWebhookModal
        open={open}
        onClose={() => setOpen(false)}
        institutionId={institutionId}
      />
    </Stack>
  );
}
