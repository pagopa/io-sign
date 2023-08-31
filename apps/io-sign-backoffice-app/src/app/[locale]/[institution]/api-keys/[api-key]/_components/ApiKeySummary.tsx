import { Stack, Typography, Chip } from "@mui/material";

import { VpnKey } from "@mui/icons-material";

import { useTranslations } from "next-intl";

import { ApiKeyWithSecret } from "@/lib/api-keys";

import ApiKeySecretForm, {
  Props as ApiKeySecretFormProps,
} from "./ApiKeySecretForm";
import { Suspense } from "react";

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
        <Chip
          label={t(`statuses.${apiKey.status}`)}
          color={apiKey.status === "active" ? "success" : "error"}
        />
      </Stack>
    </Stack>
  );
}

function ApiKeySecretCard({ secret, disabled = false }: ApiKeySecretFormProps) {
  const t = useTranslations("firmaconio.apiKey.secret");
  return (
    <Stack spacing={2} p={3} bgcolor="background.paper">
      <Stack direction="row" spacing={1} alignItems="center">
        <VpnKey fontSize="small" />
        <Typography variant="sidenav">{t("title")}</Typography>
      </Stack>
      <ApiKeySecretForm secret={secret} disabled={disabled} />
    </Stack>
  );
}

export default function ApiKeyDetail({ apiKey }: Props) {
  return (
    <Stack spacing={3}>
      <Suspense>
        <ApiKeyMetadataCard apiKey={apiKey} />
        <ApiKeySecretCard
          secret={apiKey.secret}
          disabled={apiKey.status === "revoked"}
        />
      </Suspense>
    </Stack>
  );
}
