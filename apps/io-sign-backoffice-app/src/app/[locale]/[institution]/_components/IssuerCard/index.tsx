import { use } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";

import { Typography, Stack } from "@mui/material";

import { getInstitution } from "@/lib/institutions/use-cases";
import { getIssuerByInstitution } from "@/lib/issuers/use-cases";

import IssuerEmailSection from "./IssuerEmailSection";

export type Props = {
  institutionId: string;
};

export default function IssuerCard({ institutionId }: Props) {
  const t = useTranslations("firmaconio.overview.cards.issuer");
  const institution = use(getInstitution(institutionId));
  if (!institution) {
    notFound();
  }
  const issuer = use(getIssuerByInstitution(institution));
  return (
    <Stack
      p={3}
      spacing={3}
      width={1 / 2}
      height="100%"
      bgcolor="background.paper"
    >
      <Typography variant="h6">{t("title")}</Typography>
      <IssuerEmailSection issuer={issuer} />
    </Stack>
  );
}
