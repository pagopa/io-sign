import { Suspense } from "react";

import { useTranslations } from "next-intl";

import { Stack, Typography } from "@mui/material";
import { VpnKey } from "@mui/icons-material";

import { ApiKeyWithSecret } from "@/lib/api-keys";

import ApiKeyActionsForm, {
  Props as ApiKeyActionsFormProps,
} from "./ApiKeyActionsForm";
import ApiKeyStatusChip from "@/components/ApiKeyStatusChip";

export type Props = {
  apiKey: ApiKeyWithSecret;
};

function ApiKeyMetadataCard({ apiKey }: Props) {
  const t = useTranslations("firmaconio.apiKey");
  return (
    <Stack spacing={2} p={3} bgcolor="background.paper">
      <Stack direction="row" alignItems="center">
        <Typography variant="body2" width="200px">
          {t("environment")}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {t(`environments.${apiKey.environment}`)}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center">
        <Typography variant="body2" width="200px">
          {t("creationDate")}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {apiKey.createdAt.toLocaleDateString()}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center">
        <Typography variant="body2" width="200px">
          {t("status")}
        </Typography>
        <Suspense>
          <ApiKeyStatusChip status={apiKey.status} />
        </Suspense>
      </Stack>
    </Stack>
  );
}

function ApiKeyActions({ apiKey, disabled = false }: ApiKeyActionsFormProps) {
  const t = useTranslations("firmaconio.apiKey.secret");
  return (
    <Stack spacing={2} p={3} bgcolor="background.paper">
      <Stack direction="row" spacing={1} alignItems="center">
        <VpnKey fontSize="small" />
        <Typography variant="sidenav">{t("title")}</Typography>
      </Stack>
      <ApiKeyActionsForm apiKey={apiKey} disabled={disabled} />
    </Stack>
  );
}

export default function ApiKeyDetail({ apiKey }: Props) {
  return (
    <Stack spacing={3}>
      <Suspense>
        <ApiKeyMetadataCard apiKey={apiKey} />
        <ApiKeyActions apiKey={apiKey} disabled={apiKey.status === "revoked"} />
      </Suspense>
    </Stack>
  );
}
