import { Stack } from "@mui/material";

import PageHeader, { Props as PageHeaderProps } from "./PageHeader";

export type Props = {
  header?: PageHeaderProps;
  children: React.ReactNode;
};

export default function PageContent({ header, children }: Props) {
  return (
    <Stack p={3} spacing={5} flexGrow={1}>
      {header && <PageHeader {...header} />}
      {children}
    </Stack>
  );
}
