"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Link, Paper, Stack, Typography } from "@mui/material";
import NextLink from "next/link";

import ConfigureWebhookModal from "./ConfigureWebhookModal";
import { Add } from "@mui/icons-material";
import PageHeader from "@/components/Page/PageHeader";

type Props = {
  institutionId: string;
};

export default function WebhookEmptyView({ institutionId }: Props) {
  const t = useTranslations("firmaconio.webhook");
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" pb={3}>
        <PageHeader title={t("title")} description={t("description")} />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          {t("configure")}
        </Button>
      </Stack>
      <Stack p={3} style={{ backgroundColor: "#EEEEEE" }}>
        <Paper variant="outlined">
          <Stack
            p={3}
            direction="row"
            bgcolor="background.paper"
            justifyContent="center"
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
      </Stack>
      <ConfigureWebhookModal
        open={open}
        onClose={() => setOpen(false)}
        institutionId={institutionId}
      />
    </Stack>
  );
}
