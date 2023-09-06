import { useTranslations } from "next-intl";

import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

import { ApiKey } from "@/lib/api-keys";

import ApiKeyTableRow from "./ApiKeyTableRow";

export default function ApiKeyTable({ apiKeys }: { apiKeys: ApiKey[] }) {
  const t = useTranslations("firmaconio");
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("apiKey.displayName")}</TableCell>
            <TableCell>{t("apiKey.creationDate")}</TableCell>
            <TableCell>{t("apiKey.status")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ backgroundColor: "background.paper" }} role="rowgroup">
          {apiKeys.map((apiKey) => (
            <ApiKeyTableRow key={apiKey.id} apiKey={apiKey} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
