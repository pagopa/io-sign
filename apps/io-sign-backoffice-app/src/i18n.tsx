import { Link } from "@mui/material";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
  defaultTranslationValues: {
    l3SupportEmail: "firmaconio-tech@pagopa.it",
    strong: (text) => <strong>{text}</strong>,
    email: (address) => <Link href={`mailto:${address}`}>{address}</Link>,
  },
}));
