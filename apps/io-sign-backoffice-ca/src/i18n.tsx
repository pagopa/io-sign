import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
  defaultTranslationValues: {
    supportl3: "firmaconio-tech@pagopa.it",
    strong: (text) => <strong>{text}</strong>,
    email: (address) => <a href={`mailto:${address}`}>{address}</a>,
  },
}));
