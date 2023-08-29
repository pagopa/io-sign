import { useTranslations } from "next-intl";
import { Link, Stack, Typography } from "@mui/material";
import PageHeader from "@/components/PageHeader";

import NextLink from "next/link";

import { Alert, Box, Button } from "@mui/material";

import { Add } from "@mui/icons-material";

export default function Page() {
  const t = useTranslations("firmaconio.apiKeys");
  return (
    <Stack spacing={6}>
      <Stack spacing={5}>
        <PageHeader title={t("title")} description={t("description")} />
        <Alert severity="warning" variant="outlined">
          Attualmente è possibile generare API Key solo per eseguire i test. Se
          necessiti di una chiave di produzione, contattaci a
          firmaconio-tech@pagopa.it
        </Alert>
      </Stack>
      <Stack spacing={4}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">API Key generate</Typography>
          <Button
            variant="contained"
            href="api-keys/create"
            LinkComponent={NextLink}
            size="small"
            startIcon={<Add />}
          >
            Genera API Key
          </Button>
        </Stack>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          bgcolor="background.paper"
          p={2}
        >
          <Typography variant="body2">
            Non è presente ancora nessuna API Key per questo ente.
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
