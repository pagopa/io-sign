"use client";

import { use } from "react";
import { Box, Typography } from "@mui/material";

export default function Quote({ content }: { content: Promise<string> }) {
  const quote = use(content);
  return (
    <Box p={2}>
      <Typography variant="body1">{quote}</Typography>
    </Box>
  );
}
