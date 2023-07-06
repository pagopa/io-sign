"use client";

// MUI does not yet support RSC and does not mark its components as "client components"
// so to make them usable in other RSC (such as layout.tsx) we re-export them with the "use client" directive.

import { Box, BoxProps } from "@mui/material";

export default (props: BoxProps) => <Box {...props} />;
