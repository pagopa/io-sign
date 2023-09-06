import NextLink from "next/link";

import { Link as MuiLink, LinkProps } from "@mui/material";

export type Props = Pick<
  LinkProps,
  "sx" | "variant" | "p" | "href" | "children"
>;

export default function Link({
  href = "#",
  variant = "body2",
  ...props
}: Props) {
  return (
    <MuiLink
      href={href}
      variant={variant}
      color="primary"
      fontWeight={700}
      underline="none"
      component={NextLink}
      {...props}
    />
  );
}
