"use client";

import { Stack, Typography, IconButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

export type Props = {
  value: string;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  transform?: (i: string) => string;
};

export default function EditableListItem({
  value,
  onEdit,
  onDelete,
  disabled = false,
  transform,
}: Props) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" minWidth="18ch" fontWeight={600}>
        {transform?.(value) ?? value}
      </Typography>
      {!disabled && (
        <Stack direction="row" spacing={1}>
          {onEdit && (
            <IconButton
              aria-label="Modifica"
              size="small"
              color="primary"
              onClick={onEdit}
            >
              <Edit fontSize="inherit" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              aria-label="Elimina"
              size="small"
              sx={{ color: "error.main" }}
              onClick={onDelete}
            >
              <Delete fontSize="inherit" />
            </IconButton>
          )}
        </Stack>
      )}
    </Stack>
  );
}
