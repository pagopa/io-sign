"use client";

import { Box, Typography } from "@mui/material";

export default async function Quote({ content }: { content: Promise<string> }) {
  const quote = await content;
  return (
    <Box p={2}>
      <Typography variant="body1">{quote}</Typography>
    </Box>
  );
}
