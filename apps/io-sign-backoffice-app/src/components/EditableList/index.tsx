"use client";

import { useCallback, useState } from "react";

import { Stack, Box, Button } from "@mui/material";

import EditableListForm from "./EditableListForm";
import EditableListItem from "./EditableListItem";
import EditItemModal from "./EditItemModal";

import { z } from "zod";

import { Add } from "@mui/icons-material";
import DeleteItemModal from "./DeleteItemModal";

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
  deleteModal?: {
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
  deleteModal,
  disabled = false,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [action, setAction] = useState<"edit" | "delete" | undefined>(
    undefined
  );
  const [selectedItemIndex, selectItem] = useState(-1);

  const addItem = (item: string) => {
    onChange([item, ...items]);
    setShowForm(false);
  };

  const reset = useCallback(() => {
    selectItem(-1);
    setAction(undefined);
  }, []);

  const editItem = (item: string) => {
    onChange(items.map((el, i) => (i === selectedItemIndex ? item : el)));
    reset();
  };

  const deleteItem = useCallback(() => {
    onChange(items.filter((_, i) => i !== selectedItemIndex));
    reset();
  }, [reset, items, onChange, selectedItemIndex]);

  const onEdit = (index: number) => () => {
    setAction("edit");
    selectItem(index);
  };

  const onDelete = useCallback(
    (index: number) => () => {
      selectItem(index);
      if (deleteModal) {
        setAction("delete");
      } else {
        deleteItem();
      }
    },
    [deleteModal, deleteItem]
  );

  const onClose = () => reset();

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
              onDelete={onDelete(index)}
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
      {selectedItemIndex > -1 && action === "edit" && (
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
      {deleteModal && selectedItemIndex > -1 && action === "delete" && (
        <DeleteItemModal
          open={selectedItemIndex > -1}
          title={deleteModal.title}
          description={deleteModal.description}
          onConfirm={deleteItem}
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
