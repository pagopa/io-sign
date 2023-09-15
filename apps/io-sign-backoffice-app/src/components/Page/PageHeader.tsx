import { Stack, Typography } from "@mui/material";

import Navigation, { Props as NavigationProps } from "@/components/Navigation";

export type Props = {
  title?: string;
  description?: string;
  navigation?: NavigationProps;
};

export default function PageHeader({ title, description, navigation }: Props) {
  return (
    <Stack spacing={2}>
      {navigation && <Navigation {...navigation} />}
      {title && <Typography variant="h4">{title}</Typography>}
      {description && <Typography variant="body1">{description}</Typography>}
    </Stack>
  );
}
