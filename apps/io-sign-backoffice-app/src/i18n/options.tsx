import type { IntlConfig } from "next-intl";

import { Link } from "@mui/material";

export const defaultTranslationValues: IntlConfig["defaultTranslationValues"] =
  {
    strong: (text) => <strong>{text}</strong>,
    email: (address) => <Link href={`mailto:${address}`}>{address}</Link>,
    l3SupportEmail: "firmaconio-tech@pagopa.it",
  };
