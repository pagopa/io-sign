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
  editModal: {
    title: string;
    description?: string;
  };
};

export default function EditableList({
  value,
  schema,
  onChange,
  inputLabel,
  addItemButtonLabel,
  editModal,
}: Props) {
  const [items, setItems] = useState(value);
  const [showForm, setShowForm] = useState(false);

  const [selectedItemIndex, selectItem] = useState(-1);

  useEffect(() => {
    onChange(items);
  }, [items]);

  const addItem = (item: string) => {
    setItems((items) => [...items, item]);
    setShowForm(false);
  };

  const editItem = (item: string) => {
    setItems((items) => {
      const updated = items.map((el, i) =>
        i === selectedItemIndex ? item : el
      );
      return updated;
    });
    selectItem(-1);
  };

  const deleteItem = (index: number) => () => {
    setItems((items) => items.filter((_, i) => i !== index));
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
          disabled={showForm}
        >
          {addItemButtonLabel}
        </Button>
      </Box>
    </Stack>
  );
}
