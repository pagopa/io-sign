"use client";

import { Stack, Typography, IconButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

export type Props = {
  value: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function EditableListItem({ value, onEdit, onDelete }: Props) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" minWidth="18ch" fontWeight={600}>
        {value}
      </Typography>
      <Stack direction="row" spacing={1}>
        {onEdit && (
          <IconButton size="small" color="primary">
            <Edit fontSize="inherit" />
          </IconButton>
        )}
        {onDelete && (
          <IconButton size="small" sx={{ color: "error.main" }}>
            <Delete fontSize="inherit" />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
}
