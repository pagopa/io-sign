import Link from "next/link";

import { ExitToApp, SvgIconComponent } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

export type NavItem = {
  title: string;
  icon: SvgIconComponent;
  href: string;
  segment?: null | string;
};

export type Props = {
  item: NavItem;
  external?: boolean;
  selected?: boolean;
};

export default function SidenavItem({
  item,
  external = false,
  selected = false,
}: Props) {
  return (
    <ListItemButton selected={selected} href={item.href} LinkComponent={Link}>
      <ListItemIcon>
        <item.icon fontSize="inherit" />
      </ListItemIcon>
      <ListItemText primary={item.title} />
      {external && (
        <ListItemIcon>
          <ExitToApp color="action" />
        </ListItemIcon>
      )}
    </ListItemButton>
  );
}
