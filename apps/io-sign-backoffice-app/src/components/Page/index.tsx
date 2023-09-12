import { Stack, Container } from "@mui/material";

import Sidenav from "@/components/Sidenav";

import PageContent, { Props as PageContentProps } from "./PageContent";

export type Props = PageContentProps & { hideSidenav?: boolean };

export default function Page(props: Props) {
  const content = (
    <PageContent header={props.header}>{props.children}</PageContent>
  );
  if (props.hideSidenav) {
    return <Container sx={{ flexGrow: 1 }}>{content}</Container>;
  }
  return (
    <Stack direction="row" flexGrow={1}>
      <Sidenav />
      {content}
    </Stack>
  );
}
