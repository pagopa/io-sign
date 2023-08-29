"use client";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Stack,
  Typography,
  Button,
  TextField,
  IconButton,
  Modal,
  Box,
} from "@mui/material";
import { useState } from "react";

function EditableList() {
  const [items, setItems] = useState<Array<string>>([]);

  const [showForm, setShowForm] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");

  const [open, setOpen] = useState(false);

  function handleAddItemClick() {
    setShowForm(true);
  }

  function handleConfirmClick() {
    setItems((items) => [...items, newItemValue]);
    setShowForm(false);
    setNewItemValue("");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewItemValue(e.target.value);
  }

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Stack spacing={3}>
      {items.length > 0 && (
        <Stack spacing={2}>
          {items.map((item, i) => (
            <Stack key={i} direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" fontWeight={600} minWidth="18ch">
                {item}
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton color="primary" size="small">
                  <Edit fontSize="inherit" />
                </IconButton>
                <IconButton sx={{ color: "error.main" }} size="small">
                  <Delete fontSize="inherit" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute" as "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "4px",
            outline: 0,
          }}
        >
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h6">Modifica Indirizzo IP</Typography>
              <Typography variant="body1">
                Fai attenzione alla modifica, potrebbero esserci dei casini
                (capiamo)
              </Typography>
            </Stack>
            <TextField label="Indirizzo IP" defaultValue="93.146.5.15" />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleClose}>
                Annulla
              </Button>
              <Button variant="contained" disabled>
                Modifica
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      {showForm && (
        <Stack direction="row" spacing={2}>
          <TextField
            label="Inserisci indirizzo IP"
            value={newItemValue}
            onChange={handleInputChange}
            size="small"
          />
          <Button variant="text" onClick={handleConfirmClick} size="small">
            Conferma
          </Button>
        </Stack>
      )}

      <Box>
        <Button
          variant="contained"
          size="small"
          disabled={showForm}
          onClick={handleAddItemClick}
          startIcon={<Add />}
        >
          Aggiungi indirizzo IP
        </Button>
      </Box>
    </Stack>
  );
}

export default function ApiKeyNetworkCard() {
  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Typography variant="h6">Indirizzi IP</Typography>
      <Typography variant="body1">
        Aggiungi uno o più indirizzi IP. Se non lo hai, potrai aggiungerlo anche
        in seguito.
      </Typography>
      <EditableList />
    </Stack>
  );
}
