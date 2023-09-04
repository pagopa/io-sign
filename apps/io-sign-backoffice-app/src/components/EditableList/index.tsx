"use client";

import { useState } from "react";

import { Stack, Box, Button } from "@mui/material";

import EditableListForm from "./EditableListForm";
import EditableListItem from "./EditableListItem";
import EditItemModal from "./EditItemModal";

import { z } from "zod";

import { Add } from "@mui/icons-material";

export type Props = {
  items: Array<string>;
  onChange: (newValue: Array<string>) => void;
  schema: z.ZodSchema<string>;
  inputLabel: string;
  addItemButtonLabel: string;
  editModal: {
    title: string;
    description?: string;
  };
  disabled?: boolean;
};

export default function EditableList({
  items,
  schema,
  onChange,
  inputLabel,
  addItemButtonLabel,
  editModal,
  disabled = false,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedItemIndex, selectItem] = useState(-1);

  const addItem = (item: string) => {
    onChange([item, ...items]);
    setShowForm(false);
  };

  const editItem = (item: string) => {
    onChange(items.map((el, i) => (i === selectedItemIndex ? item : el)));
    selectItem(-1);
  };

  const deleteItem = (index: number) => () => {
    onChange(items.filter((_, i) => i !== index));
  };

  const onEdit = (index: number) => () => {
    selectItem(index);
  };

  const onClose = () => {
    selectItem(-1);
  };

  const onClick = () => setShowForm(true);

  return (
    <Stack spacing={3}>
      {items.length > 0 && (
        <Stack spacing={2}>
          {items.map((item, index) => (
            <EditableListItem
              key={item}
              value={item}
              onEdit={onEdit(index)}
              onDelete={deleteItem(index)}
              disabled={disabled}
            />
          ))}
        </Stack>
      )}
      {showForm && (
        <EditableListForm
          schema={schema}
          inputLabel={inputLabel}
          onConfirm={addItem}
        />
      )}
      {selectedItemIndex > -1 && (
        <EditItemModal
          open={selectedItemIndex > -1}
          title={editModal.title}
          description={editModal.description}
          inputLabel={inputLabel}
          schema={schema}
          initialValue={items[selectedItemIndex]}
          onConfirm={editItem}
          onClose={onClose}
        />
      )}
      <Box>
        <Button
          size="small"
          fullWidth={false}
          variant="contained"
          startIcon={<Add />}
          onClick={onClick}
          disabled={disabled || showForm}
        >
          {addItemButtonLabel}
        </Button>
      </Box>
    </Stack>
  );
}
