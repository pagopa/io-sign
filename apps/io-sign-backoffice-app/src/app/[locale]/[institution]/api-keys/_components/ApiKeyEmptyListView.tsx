import { useTranslations } from "next-intl";

import { Skeleton, Stack, Alert } from "@mui/material";

import ApiKeyTableHeader from "./ApiKeyListHeader";
import ApiKeyEmptyTable from "./ApiKeyEmptyTable";

type Props = {
  loading?: boolean;
};

export default function ApiKeyEmptyListView({ loading = false }: Props) {
  const t = useTranslations("firmaconio");
  return (
    <Stack spacing={5}>
      <Alert
        severity="warning"
        variant="outlined"
        children={t.rich("apiKeys.alert")}
      />
      <ApiKeyTableHeader showAction={!loading} />
      {loading ? (
        <Stack
          p={2}
          bgcolor="background.paper"
          children={<Skeleton variant="text" />}
        />
      ) : (
        <ApiKeyEmptyTable />
      )}
    </Stack>
  );
}
