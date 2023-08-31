"use client";

import { useState, useEffect, useRef } from "react";

import { Stack, Box, Button } from "@mui/material";

import EditableListForm from "./EditableListForm";
import EditableListItem from "./EditableListItem";
import EditItemModal from "./EditItemModal";

import { isEqual } from "lodash";

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
  disabled?: boolean;
};

export default function EditableList({
  value,
  schema,
  onChange,
  inputLabel,
  addItemButtonLabel,
  editModal,
  disabled = false,
}: Props) {
  const [items, setItems] = useState(value);
  const [showForm, setShowForm] = useState(false);
  const [selectedItemIndex, selectItem] = useState(-1);

  // prev holds a reference to the previous
  // state in order to trigger onChange only
  // on actual state changes
  const prev = useRef(value);

  // prev it's needed because useEffect
  // is called multiple times for the same state value
  // (for example on component mount)
  useEffect(() => {
    if (!isEqual(prev.current, items)) {
      onChange(items);
      prev.current = items;
    }
  }, [items]);

  const addItem = (item: string) => {
    setItems((items) => [item, ...items]);
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
