import NextLink from "next/link";

import { Stack, Button, Breadcrumbs, Link } from "@mui/material";
import { ArrowBack, SvgIconComponent } from "@mui/icons-material";

export type Props = {
  hierarchy: Array<{
    label: string;
    icon?: SvgIconComponent;
    href?: string;
  }>;
  startButton?: {
    label: string;
    href: string;
  };
};

export default function Navigation({ hierarchy, startButton }: Props) {
  return (
    <Stack direction="row" alignItems="center" spacing={3}>
      {startButton && (
        <Button
          sx={{
            padding: 0,
            minWidth: 0,
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
          variant="text"
          size="small"
          startIcon={<ArrowBack />}
          disableRipple
          LinkComponent={NextLink}
          href={startButton.href}
          accessKey="b"
        >
          {startButton.label}
        </Button>
      )}
      <Breadcrumbs>
        {hierarchy.map(({ icon: Icon, label, href }, i) => (
          <Link
            href={href}
            color={href ? "text.primary" : "text.disabled"}
            underline="none"
            sx={{ display: "flex", alignItems: "center" }}
            key={i}
          >
            {Icon && <Icon sx={{ mr: 0.5 }} fontSize="inherit" />}
            {label}
          </Link>
        ))}
      </Breadcrumbs>
    </Stack>
  );
}
