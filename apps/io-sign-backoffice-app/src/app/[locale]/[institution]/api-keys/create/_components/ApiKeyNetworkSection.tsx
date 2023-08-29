"use client";

import {
  Stack,
  Typography,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import { useTranslations } from "next-intl";
import {
  useForm,
  useFormContext,
  Controller,
  useFieldArray,
} from "react-hook-form";

import { FormFields } from "./CreateApiKeyForm";
import { Add, Delete, Edit } from "@mui/icons-material";
import { Box } from "@mui/system";
import React, { useEffect, useRef, useState } from "react";

function EditableListInput({
  onConfirm,
}: {
  onConfirm: (input: string) => void;
}) {
  const [input, setInput] = useState("");

  const handeTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setInput(e.target.value);

  const confirm = () => {
    onConfirm(input);
    setInput("");
  };

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        size="small"
        value={input}
        onChange={handeTextFieldChange}
        label="Inserisci elemento"
      />
      <Button variant="text" onClick={confirm} size="small">
        Conferma
      </Button>
    </Stack>
  );
}

function EditableListItem({
  value,
  onEdit,
  onDelete,
}: {
  value: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" minWidth="18ch" fontWeight={600}>
        {value}
      </Typography>
      <Stack direction="row" spacing={1}>
        <IconButton size="small" color="primary">
          <Edit fontSize="inherit" />
        </IconButton>
        <IconButton size="small" sx={{ color: "error.main" }}>
          <Delete fontSize="inherit" />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function EditableList({
  value,
  onChange,
}: {
  value: string[];
  onChange: (newValue: string[]) => void;
}) {
  const [showInput, setShowInput] = useState(false);

  const [items, setItems] = useState(value);

  const handleAddItemButtonClick = () => setShowInput(true);

  const handleConfirm = (input: string) => {
    setItems((items) => [...items, input]);
    setShowInput(false);
  };

  useEffect(() => {
    onChange(items);
  }, [items]);

  return (
    <Stack spacing={3}>
      {items.length > 0 && (
        <Stack spacing={2}>
          {items.map((item, i) => (
            <EditableListItem
              key={item}
              value={item}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </Stack>
      )}
      {showInput && <EditableListInput onConfirm={handleConfirm} />}
      <Box>
        <Button
          size="small"
          fullWidth={false}
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddItemButtonClick}
          disabled={showInput}
        >
          Aggiungi elemento
        </Button>
      </Box>
    </Stack>
  );
}

export default function ApiKeyNetworkSection() {
  const t = useTranslations("firmaconio.createApiKey.form.network");

  const { setValue } = useFormContext<FormFields>();

  const onEditableListChange = (items: string[]) => {
    setValue("cidrs", items);
  };

  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Typography variant="h6">{t("title")}</Typography>
      <Typography variant="body1">{t("description")}</Typography>
      <Controller
        name="cidrs"
        render={({ field }) => (
          <EditableList value={field.value} onChange={onEditableListChange} />
        )}
      />
    </Stack>
  );
}
