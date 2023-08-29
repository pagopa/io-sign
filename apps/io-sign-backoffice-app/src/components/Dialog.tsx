"use client";

import { Modal, Box, ModalProps } from "@mui/material";

export type Props = Pick<ModalProps, "open" | "onClose"> & {
  children: React.ReactNode;
};

export default function Dialog({ open, children }: Props) {
  return (
    <Modal open={open} onClose={() => {}}>
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
        children={children}
      />
    </Modal>
  );
}
