import { useTranslations } from "next-intl";

import { Typography, Stack, Link } from "@mui/material";

import { getSupportContact } from "@/lib/support";

export default function SupportCard() {
  const t = useTranslations("firmaconio.overview.cards.support");
  const contact = getSupportContact();
  const stages = [{ name: "test", contact }, { name: "prod" }];
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
      {stages.map(({ name, contact }) => (
        <Stack direction="row" key={name}>
          <Typography width="157px" variant="body2">
            {t(`environments.${name}.label`)}
          </Typography>
          <Typography style={{ whiteSpace: "pre" }} variant="body2">
            {t(`environments.${name}.action`)}
          </Typography>
          {contact && (
            <Link href={`mailto:${contact.email}`} variant="body2">
              {contact.email}
            </Link>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
