import type { IntlConfig } from "next-intl";

import { Link } from "@mui/material";

import { SUPPORT_L3_EMAIL_DEFAULT } from "@/lib/support";

export const defaultTranslationValues: IntlConfig["defaultTranslationValues"] =
  {
    strong: (text) => <strong>{text}</strong>,
    email: (address) => <Link href={`mailto:${address}`}>{address}</Link>,
    l3SupportEmail: SUPPORT_L3_EMAIL_DEFAULT,
  };
