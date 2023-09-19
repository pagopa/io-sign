import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";

import { KeyboardArrowRight } from "@mui/icons-material";

import { ApiKey } from "@/lib/api-keys";

import Link from "@/components/Link";
import ApiKeyStatusChip from "@/components/ApiKeyStatusChip";

export type Props = {
  apiKey: ApiKey;
};

export default function ApiKeyTableRow({ apiKey }: Props) {
  const href = `api-keys/${apiKey.id}`;
  return (
    <TableRow key={apiKey.id}>
      <TableCell>
        <Link href={href} p={2}>
          {apiKey.displayName}
        </Link>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {apiKey.createdAt.toLocaleDateString()}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <ApiKeyStatusChip status={apiKey.status} />
          </Box>
          <IconButton color="primary" href={href}>
            <KeyboardArrowRight fontSize="inherit" />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
