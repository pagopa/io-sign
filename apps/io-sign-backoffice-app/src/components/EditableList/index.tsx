"use client";

import { useState, useEffect } from "react";

import { Stack, Box, Button } from "@mui/material";

import EditableListForm from "./EditableListForm";
import EditableListItem from "./EditableListItem";
import EditItemModal from "./EditItemModal";

import { z } from "zod";

import { Add } from "@mui/icons-material";

export type Props = {
  value: Array<string>;
  onChange: (newValue: Array<string>) => void;
  schema: z.ZodSchema<string>;
  inputLabel: string;
  addItemButtonLabel: string;
};

export default function EditableList({
  value,
  schema,
  onChange,
  inputLabel,
  addItemButtonLabel,
}: Props) {
  const [items, setItems] = useState(value);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    onChange(items);
  }, [items]);

  const onConfirm = (item: string) => {
    setItems((items) => [...items, item]);
    setShowForm(false);
  };

  const onAddItemButtonClick = () => setShowForm(true);

  return (
    <Stack spacing={3}>
      {items.length > 0 && (
        <Stack spacing={2}>
          {items.map((item) => (
            <EditableListItem key={item} value={item} />
          ))}
        </Stack>
      )}
      {showForm && (
        <EditableListForm
          schema={schema}
          inputLabel={inputLabel}
          onConfirm={onConfirm}
        />
      )}
      <Box>
        <Button
          size="small"
          fullWidth={false}
          variant="contained"
          startIcon={<Add />}
          onClick={onAddItemButtonClick}
          disabled={showForm}
        >
          {addItemButtonLabel}
        </Button>
      </Box>
    </Stack>
  );
}
