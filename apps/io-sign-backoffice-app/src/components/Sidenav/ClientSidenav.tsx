"use client";

import Link from "next/link";

import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { ExitToApp, SvgIconComponent } from "@mui/icons-material";
import { useParams, useSelectedLayoutSegment } from "next/navigation";

type NavItem = {
  title: string;
  icon: SvgIconComponent;
  href: string;
};

type Props = {
  pages: Array<NavItem & { segment: null | string }>;
  external: Array<NavItem>;
};

export default function Sidenav({ pages, external }: Props) {
  const selected = useSelectedLayoutSegment();
  const params = useParams();

  return (
    <Box
      sx={{
        maxWidth: 300,
        flexGrow: 1,
        backgroundColor: "background.paper",
      }}
    >
      <List component="nav">
        {pages.map(({ icon: Icon, title, segment, href }) => (
          <ListItemButton
            key={title}
            selected={selected === segment}
            href={href}
            LinkComponent={Link}
          >
            <ListItemIcon>
              <Icon fontSize="inherit" />
            </ListItemIcon>
            <ListItemText primary={title} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List component="nav">
        {external.map(({ icon: Icon, title, href }) => (
          <ListItemButton key={title} href={href} LinkComponent={Link}>
            <ListItemIcon>
              <Icon fontSize="inherit" />
            </ListItemIcon>
            <ListItemText primary={title} />
            <ListItemIcon>
              <ExitToApp color="action" />
            </ListItemIcon>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
