import { useTranslations } from "next-intl";

import { Typography, Stack, Link } from "@mui/material";

import { getSupportContactsByPhase } from "@/lib/support";

export default function SupportCard() {
  const t = useTranslations("firmaconio.overview.cards.support");
  const contacts = getSupportContactsByPhase();
  return (
    <Stack
      p={3}
      spacing={3}
      width={1 / 2}
      height="100%"
      bgcolor="background.paper"
    >
      <Stack spacing={2}>
        <Typography variant="h6">{t("title")}</Typography>
        <Typography variant="body2">{t("description")}</Typography>
      </Stack>
      {contacts.map((contact) => (
        <Stack key={contact.email} direction="row">
          <Typography width="157px" variant="body2">
            {t(`environments.${contact.phase}.label`)}
          </Typography>
          <Link href={`mailto:${contact.email}`} variant="body2">
            {contact.email}
          </Link>
        </Stack>
      ))}
    </Stack>
  );
}
