import React from "react";
import { Stack } from "@/components/mui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Stack flexGrow={1}>{children}</Stack>;
}
