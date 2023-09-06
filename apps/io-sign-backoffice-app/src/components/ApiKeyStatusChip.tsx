import { useTranslations } from "next-intl";

import { Chip } from "@mui/material";

import { ApiKey } from "@/lib/api-keys";

export type Props = {
  status: ApiKey["status"];
};

export default function ApiKeyStatusChip({ status }: Props) {
  const t = useTranslations("firmaconio.apiKey.statuses");
  return (
    <Chip color={status == "active" ? "success" : "error"} label={t(status)} />
  );
}
